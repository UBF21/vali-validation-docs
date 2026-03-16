---
id: aspnetcore-integration
title: Integración con ASP.NET Core
sidebar_position: 12
---

# Integración con ASP.NET Core

El paquete `Vali-Validation.AspNetCore` proporciona tres mecanismos de integración con ASP.NET Core.

## Instalar el paquete

```bash
dotnet add package Vali-Validation.AspNetCore
```

---

## Middleware: UseValiValidationExceptionHandler

El middleware captura todas las instancias de `ValidationException` que se propagan por el pipeline HTTP y las convierte en una respuesta HTTP 400 con formato `application/problem+json` (RFC 7807).

### Registrar el middleware

```csharp
// Program.cs
app.UseValiValidationExceptionHandler();
```

> **El orden importa:** registra el middleware **antes** de `UseRouting`, `UseAuthentication`, `UseAuthorization` y `MapControllers`/`MapEndpoints`.

### Formato de respuesta

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Failed",
  "status": 400,
  "errors": {
    "Name": ["El nombre es obligatorio.", "El nombre debe tener al menos 3 caracteres."],
    "Email": ["El formato del email no es válido."],
    "Price": ["El precio debe ser mayor que 0."]
  }
}
```

---

## AddValiValidationProblemDetails

Registra el soporte estándar de `ProblemDetails` de ASP.NET Core. Es necesario para que `Results.ValidationProblem()` en Minimal APIs use el formato RFC 7807 correctamente.

```csharp
builder.Services.AddValiValidationProblemDetails();
```

---

## ValiValidationFilter\<T\>: Endpoint Filter para Minimal API

Es un endpoint filter que valida automáticamente el argumento de tipo `T` antes de ejecutar el handler del endpoint. Si la validación falla, devuelve `Results.ValidationProblem(errors)` sin ejecutar el handler.

### Registrar con WithValiValidation\<T\>

```csharp
app.MapPost("/products", async (
    [FromBody] CreateProductRequest request,
    [FromServices] IProductRepository repository,
    CancellationToken ct) =>
{
    // Si llegamos aquí, CreateProductRequest ya ha sido validado
    var product = await repository.CreateAsync(request, ct);
    return Results.Created($"/products/{product.Id}", product);
})
.WithValiValidation<CreateProductRequest>();
```

### Ventajas frente a la validación manual

```csharp
// Sin WithValiValidation: validación manual en cada endpoint
app.MapPost("/products", async (request, validator, repository, ct) =>
{
    var result = await validator.ValidateAsync(request, ct);
    if (!result.IsValid)
        return Results.ValidationProblem(result.Errors.ToDictionary(
            k => k.Key, v => v.Value.ToArray()));

    var product = await repository.CreateAsync(request, ct);
    return Results.Created($"/products/{product.Id}", product);
});

// Con WithValiValidation: el handler queda limpio
app.MapPost("/products", async (request, repository, ct) =>
{
    var product = await repository.CreateAsync(request, ct);
    return Results.Created($"/products/{product.Id}", product);
})
.WithValiValidation<CreateProductRequest>();
```

---

## ValiValidateAttribute: Action Filter para controladores MVC

Es un action filter para controladores MVC. Cuando se aplica a una acción o a un controlador, valida automáticamente todos los argumentos de acción que tengan un `IValidator<T>` registrado en DI.

### Aplicar a todo el controlador

```csharp
[ApiController]
[Route("api/[controller]")]
[ValiValidate] // Se aplica a todas las acciones del controlador
public class ProductsController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateProductRequest request, // Validado automáticamente
        CancellationToken ct)
    {
        // Si llegamos aquí, request es válido
        var product = await _service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }
}
```

### Aplicar a una acción específica

```csharp
[HttpPost]
[ValiValidate] // Solo esta acción usa el filtro
public async Task<IActionResult> Create(
    [FromBody] CreateOrderRequest request,
    CancellationToken ct)
{
    var order = await _service.CreateAsync(request, ct);
    return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
}
```

---

## Cuándo usar cada mecanismo

| Mecanismo | Cuándo usar |
|---|---|
| `UseValiValidationExceptionHandler` | Cuando la validación ocurre en la capa de servicio (con `ValidateAndThrowAsync`) o cuando se usa el behavior de MediatR |
| `WithValiValidation<T>` | Endpoints de Minimal API donde el handler recibe el body directamente |
| `[ValiValidate]` | Controladores MVC donde la acción recibe el body como argumento |

---

## Siguientes pasos

- **[MediatR](mediatr-integration)** — Pipeline behavior para MediatR
- **[Vali-Mediator](valimediator-integration)** — Pipeline behavior con Result\<T\>
- **[Inyección de dependencias](dependency-injection)** — Registro y resolución de validadores
