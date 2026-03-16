---
id: mediatr-integration
title: Integración con MediatR
sidebar_position: 13
---

# Integración con MediatR

El paquete `Vali-Validation.MediatR` registra un `IPipelineBehavior<TRequest, TResponse>` que valida automáticamente el request antes de que llegue al handler. Si la validación falla, lanza `ValidationException`.

## Instalar

```bash
dotnet add package Vali-Validation.MediatR
dotnet add package MediatR
```

---

## Cómo funciona el pipeline

```
Request
  │
  ▼
ValidationBehavior<TRequest, TResponse>
  │
  ├─ ¿Hay un IValidator<TRequest> registrado?
  │    No  → llama a next() sin validar
  │    Sí → llama a ValidateAsync(request)
  │              │
  │              ├─ IsValid → llama a next()
  │              └─ !IsValid → lanza ValidationException
  ▼
Handler
```

---

## Métodos de registro

### Opción 1: AddValiValidationBehavior (solo el behavior)

```csharp
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));
builder.Services.AddValidationsFromAssembly(assembly);
builder.Services.AddValiValidationBehavior();
```

### Opción 2: AddMediatRWithValidation (todo en uno)

```csharp
builder.Services.AddMediatRWithValidation(
    cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly),
    validatorsAssembly: typeof(Program).Assembly,
    lifetime: ServiceLifetime.Transient);
```

---

## Ejemplo completo

### Validator

```csharp
public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    private static readonly string[] ValidCategories =
        new[] { "Electronics", "Clothing", "Books", "Food", "Other" };

    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
                .WithMessage("El nombre del producto es obligatorio.")
                .WithErrorCode("NAME_REQUIRED")
            .MinimumLength(3)
                .WithMessage("El nombre debe tener al menos 3 caracteres.")
            .MaximumLength(200);

        RuleFor(x => x.Price)
            .GreaterThan(0m)
                .WithMessage("El precio debe ser mayor que 0.")
                .WithErrorCode("PRICE_INVALID")
            .MaxDecimalPlaces(2);

        RuleFor(x => x.Category)
            .NotEmpty()
            .In(ValidCategories)
                .WithMessage($"La categoría debe ser una de: {string.Join(", ", ValidCategories)}.");
    }
}
```

### Handler limpio (sin validación manual)

```csharp
public class CreateProductHandler : IRequestHandler<CreateProductCommand, ProductDto>
{
    public async Task<ProductDto> Handle(
        CreateProductCommand command,
        CancellationToken cancellationToken)
    {
        // Si llegamos aquí, la validación ya pasó en el behavior
        var product = await _repository.CreateAsync(command, cancellationToken);
        return new ProductDto(product.Id, product.Name, product.Price, product.Category);
    }
}
```

### Program.cs

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMediatRWithValidation(
    cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly),
    validatorsAssembly: typeof(Program).Assembly,
    lifetime: ServiceLifetime.Transient);

builder.Services.AddControllers();

var app = builder.Build();

app.UseValiValidationExceptionHandler(); // Captura ValidationException del behavior
app.MapControllers();
app.Run();
```

---

## Behavior cuando no hay validador

Si envías un command o query sin validador registrado, el behavior lo deja pasar sin error:

```csharp
// Esta query no tiene validador
public record GetAllProductsQuery : IRequest<List<ProductDto>>;

// El behavior no hace nada, el handler se ejecuta directamente
var products = await _mediator.Send(new GetAllProductsQuery());
```

---

## Flujo de error completo

```
POST /api/products
Body: { "name": "", "price": -5, "category": "Unknown" }

→ Pipeline de MediatR
→ ValidationBehavior<CreateProductCommand, ProductDto>
    → ValidateAsync(command)
    → result.IsValid = false
    → throw new ValidationException(result)
→ Middleware UseValiValidationExceptionHandler
    → Respuesta 400:
       {
         "type": "https://tools.ietf.org/html/rfc7807",
         "title": "Validation Failed",
         "status": 400,
         "errors": {
           "Name": ["El nombre del producto es obligatorio."],
           "Price": ["El precio debe ser mayor que 0."],
           "Category": ["La categoría debe ser una de: Electronics, Clothing, Books, Food, Other."]
         }
       }
```

---

## Siguientes pasos

- **[Vali-Mediator](valimediator-integration)** — Alternativa con Result\<T\> en lugar de excepciones
- **[ASP.NET Core](aspnetcore-integration)** — Middleware que captura la excepción del behavior
