---
id: dependency-injection
title: Inyección de dependencias
sidebar_position: 11
---

# Inyección de dependencias

## Registro automático con AddValidationsFromAssembly

El método de extensión `AddValidationsFromAssembly` escanea un assembly y registra automáticamente todas las clases que implementan `IValidator<T>` en el contenedor DI.

```csharp
// Program.cs
using Vali_Validation.Core.Extensions;

builder.Services.AddValidationsFromAssembly(
    assembly: typeof(Program).Assembly,
    lifetime: ServiceLifetime.Transient); // Transient es el valor por defecto
```

### Registro desde múltiples assemblies

```csharp
builder.Services.AddValidationsFromAssembly(typeof(Program).Assembly);
builder.Services.AddValidationsFromAssembly(typeof(ApplicationLayerMarker).Assembly);
builder.Services.AddValidationsFromAssembly(typeof(InfrastructureLayerMarker).Assembly);
```

---

## ServiceLifetime: cuál elegir

| Lifetime | Descripción | Cuándo usar |
|---|---|---|
| `Transient` | Nueva instancia en cada resolución | Validadores sin dependencias o con dependencias Transient |
| `Scoped` | Una instancia por petición HTTP | Si el validador depende de DbContext u otro servicio Scoped |
| `Singleton` | Una instancia para toda la app | Solo si el validador no tiene dependencias mutables |

### Regla de oro

> El lifetime del validador debe ser igual o más corto que el lifetime de sus dependencias más longevas.

```csharp
// Correcto: DbContext es Scoped, el validador también es Scoped
builder.Services.AddValidationsFromAssembly(assembly, ServiceLifetime.Scoped);

// Incorrecto: DbContext es Scoped, el validador es Singleton → captive dependency
builder.Services.AddValidationsFromAssembly(assembly, ServiceLifetime.Singleton); // EVITAR
```

---

## Inyectando IValidator\<T\> en constructores

### En un endpoint de Minimal API

```csharp
app.MapPost("/products", async (
    [FromBody] CreateProductRequest request,
    [FromServices] IValidator<CreateProductRequest> validator,
    [FromServices] IProductRepository repository,
    CancellationToken ct) =>
{
    var result = await validator.ValidateAsync(request, ct);
    if (!result.IsValid)
        return Results.ValidationProblem(result.Errors.ToDictionary(
            k => k.Key, v => v.Value.ToArray()));

    var product = await repository.CreateAsync(request, ct);
    return Results.Created($"/products/{product.Id}", product);
});
```

### En un controlador MVC

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IValidator<CreateUserRequest> _validator;
    private readonly IUserService _userService;

    public UsersController(
        IValidator<CreateUserRequest> validator,
        IUserService userService)
    {
        _validator = validator;
        _userService = userService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserRequest request,
        CancellationToken ct)
    {
        var result = await _validator.ValidateAsync(request, ct);
        if (!result.IsValid)
            return BadRequest(result.Errors);

        var user = await _userService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }
}
```

---

## Registro manual (sin AddValidationsFromAssembly)

```csharp
// Registro individual
builder.Services.AddTransient<IValidator<CreateProductRequest>, CreateProductRequestValidator>();
builder.Services.AddScoped<IValidator<CreateOrderRequest>, CreateOrderRequestValidator>();
```

---

## Testing: Mockear IValidator\<T\>

```csharp
// Con Moq
var validatorMock = new Mock<IValidator<CreateOrderRequest>>();
validatorMock
    .Setup(v => v.ValidateAsync(It.IsAny<CreateOrderRequest>(), It.IsAny<CancellationToken>()))
    .ReturnsAsync(new ValidationResult()); // Sin errores

var service = new OrderService(validatorMock.Object, repositoryMock.Object);
await service.CreateAsync(request, CancellationToken.None);
```

---

## Siguientes pasos

- **[ASP.NET Core](aspnetcore-integration)** — Middleware, filtros de endpoint y filtros de acción
- **[MediatR](mediatr-integration)** — Registro junto a MediatR
- **[Vali-Mediator](valimediator-integration)** — Registro junto a Vali-Mediator
