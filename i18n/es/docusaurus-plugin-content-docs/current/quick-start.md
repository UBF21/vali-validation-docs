---
id: quick-start
title: Inicio rápido
sidebar_position: 3
---

# Inicio rápido

Este documento muestra un ejemplo completo y funcional desde cero: definir un modelo, crear un validador, registrarlo en DI y usarlo en un endpoint de ASP.NET Core. El objetivo es que tengas validación funcionando en menos de 10 minutos.

## 1. Instalar los paquetes

```bash
dotnet add package Vali-Validation
dotnet add package Vali-Validation.AspNetCore
```

## 2. Definir el modelo

```csharp
// Models/CreateProductRequest.cs
public class CreateProductRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}
```

## 3. Crear el validador

Los validadores heredan de `AbstractValidator<T>`. Todas las reglas se definen en el constructor.

```csharp
// Validators/CreateProductRequestValidator.cs
using Vali_Validation.Core.Validators;

public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    private static readonly string[] ValidCategories =
        new[] { "Electronics", "Clothing", "Food", "Books", "Other" };

    public CreateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
                .WithMessage("El nombre del producto es obligatorio.")
            .MinimumLength(3)
                .WithMessage("El nombre debe tener al menos 3 caracteres.")
            .MaximumLength(200)
                .WithMessage("El nombre no puede superar los 200 caracteres.");

        RuleFor(x => x.Price)
            .GreaterThan(0)
                .WithMessage("El precio debe ser mayor que 0.")
            .LessThan(100000)
                .WithMessage("El precio no puede superar 100,000.");

        RuleFor(x => x.Stock)
            .GreaterThanOrEqualTo(0)
                .WithMessage("El stock no puede ser negativo.");

        RuleFor(x => x.Category)
            .NotEmpty()
                .WithMessage("La categoría es obligatoria.")
            .In(ValidCategories)
                .WithMessage("La categoría debe ser una de: Electronics, Clothing, Food, Books, Other.");

        RuleFor(x => x.ImageUrl)
            .Url()
                .WithMessage("La URL de imagen no es válida.")
            .When(x => x.ImageUrl != null);
    }
}
```

## 4. Registrar en DI

```csharp
// Program.cs
using Vali_Validation.Core.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Registra todos los IValidator<T> del assembly actual
builder.Services.AddValidationsFromAssembly(typeof(Program).Assembly);

// Si usas AspNetCore:
builder.Services.AddValiValidationProblemDetails();

var app = builder.Build();

// Middleware que convierte ValidationException en HTTP 400
app.UseValiValidationExceptionHandler();
```

## 5. Usar en un endpoint

### Opción A: Minimal API con endpoint filter

```csharp
app.MapPost("/products", async (
    CreateProductRequest request,
    IProductRepository repository) =>
{
    var product = await repository.CreateAsync(request);
    return Results.Created($"/products/{product.Id}", product);
})
.WithValiValidation<CreateProductRequest>(); // Validación automática antes del handler
```

### Opción B: Controlador MVC

```csharp
[ApiController]
[Route("api/[controller]")]
[ValiValidate] // Valida automáticamente todos los argumentos con IValidator<T> registrado
public class ProductsController : ControllerBase
{
    private readonly IProductRepository _repository;

    public ProductsController(IProductRepository repository)
    {
        _repository = repository;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request)
    {
        // Si llegamos aquí, la validación ya pasó
        var product = await _repository.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }
}
```

## 6. Ejecutar y probar

```bash
dotnet run
```

Prueba con datos inválidos:

```bash
curl -X POST http://localhost:5000/products \
  -H "Content-Type: application/json" \
  -d '{"name": "A", "price": -5, "stock": -1, "category": "Unknown"}'
```

Respuesta HTTP 400:

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Failed",
  "status": 400,
  "errors": {
    "Name": ["El nombre debe tener al menos 3 caracteres."],
    "Price": ["El precio debe ser mayor que 0."],
    "Stock": ["El stock no puede ser negativo."],
    "Category": ["La categoría debe ser una de: Electronics, Clothing, Food, Books, Other."]
  }
}
```

## Siguientes pasos

- **[Validadores en profundidad](validators)** — AbstractValidator, Include, CascadeMode global, ValidateParallelAsync
- **[Reglas básicas](basic-rules)** — Catálogo completo de todas las reglas disponibles
- **[Modificadores](modifiers)** — WithMessage, When/Unless, StopOnFirstFailure y más
