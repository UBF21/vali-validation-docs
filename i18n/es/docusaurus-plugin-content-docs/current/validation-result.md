---
id: validation-result
title: Resultado de validación
sidebar_position: 9
---

# Resultado de validación

`ValidationResult` es el objeto devuelto por `Validate()` y `ValidateAsync()`. Contiene todos los errores encontrados durante la validación, agrupados por nombre de propiedad.

---

## Estructura

```csharp
public class ValidationResult
{
    // Errores por propiedad: { "Email": ["Inválido", "Ya existe"] }
    public Dictionary<string, List<string>> Errors { get; }

    // Códigos de error por propiedad: { "Email": ["INVALID_FORMAT", "ALREADY_EXISTS"] }
    public Dictionary<string, List<string>> ErrorCodes { get; }

    // true si no hay errores
    public bool IsValid { get; }

    // Número total de mensajes de error (suma de todos los errores de todas las propiedades)
    public int ErrorCount { get; }

    // Nombres de las propiedades que tienen errores
    public IReadOnlyList<string> PropertyNames { get; }
}
```

---

## IsValid y ErrorCount

```csharp
var result = await validator.ValidateAsync(request);

if (!result.IsValid)
{
    Console.WriteLine($"La validación falló con {result.ErrorCount} error(es).");
}

// IsValid es equivalente a: result.Errors.Count == 0
// ErrorCount es la suma total: si Email tiene 2 errores y Name tiene 1, ErrorCount es 3
```

---

## Accediendo a los errores

### Por propiedad directamente

```csharp
if (result.Errors.TryGetValue("Email", out var emailErrors))
{
    foreach (var error in emailErrors)
        Console.WriteLine($"Email: {error}");
}
```

### Iterando todos los errores

```csharp
foreach (var (propertyName, errors) in result.Errors)
{
    foreach (var error in errors)
        Console.WriteLine($"{propertyName}: {error}");
}
```

### Verificando si una propiedad tiene errores

```csharp
bool hasEmailError = result.HasErrorFor("Email");
bool hasNameError = result.HasErrorFor("Name");
```

### Obteniendo errores de una propiedad

```csharp
// Devuelve una List<string> vacía si no hay errores para esa propiedad
List<string> emailErrors = result.ErrorsFor("Email");
```

### Obteniendo el primer error de una propiedad

```csharp
// Devuelve null si no hay errores para esa propiedad
string? firstError = result.FirstError("Email");
```

---

## AddError

`AddError` permite añadir errores manualmente a un `ValidationResult`. Útil para combinar validación con lógica de negocio:

```csharp
// Sin código de error
result.AddError("Email", "El email ya está en uso.");

// Con código de error
result.AddError("Email", "El email ya está en uso.", "EMAIL_ALREADY_EXISTS");
```

---

## ToFlatList

`ToFlatList()` devuelve todos los errores como una lista plana de strings en el formato `"NombrePropiedad: mensaje"`.

```csharp
List<string> flatErrors = result.ToFlatList();
foreach (var error in flatErrors)
    Console.WriteLine(error);

// Salida:
// Name: El nombre es obligatorio.
// Email: El email no tiene un formato válido.
// Password: Debe tener al menos 8 caracteres.
```

---

## Merge

`Merge` combina los errores de otro `ValidationResult` en el actual:

```csharp
var mainResult = await _mainValidator.ValidateAsync(request);
var addressResult = await _addressValidator.ValidateAsync(request.Address);
var paymentResult = await _paymentValidator.ValidateAsync(request.Payment);

mainResult.Merge(addressResult);
mainResult.Merge(paymentResult);

if (!mainResult.IsValid)
    return BadRequest(mainResult.Errors);
```

---

## ErrorCodes

`ErrorCodes` es un diccionario paralelo a `Errors` que contiene los códigos de error asignados con `WithErrorCode`.

```csharp
if (!result.IsValid)
{
    return BadRequest(new
    {
        errors = result.Errors.ToDictionary(k => k.Key, v => v.Value.ToArray()),
        errorCodes = result.ErrorCodes.ToDictionary(k => k.Key, v => v.Value.ToArray())
    });
}
```

Respuesta:

```json
{
  "errors": {
    "Email": ["El email ya está registrado."],
    "Amount": ["El importe supera el límite de crédito."]
  },
  "errorCodes": {
    "Email": ["EMAIL_ALREADY_EXISTS"],
    "Amount": ["CREDIT_LIMIT_EXCEEDED"]
  }
}
```

---

## Uso en ASP.NET Core con ValidationProblem

```csharp
app.MapPost("/users", async (CreateUserRequest request, IValidator<CreateUserRequest> validator) =>
{
    var result = await validator.ValidateAsync(request);
    if (!result.IsValid)
    {
        var errors = result.Errors.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.ToArray());

        return Results.ValidationProblem(errors);
    }

    return Results.Ok();
});
```

---

## Testing con ValidationResult

```csharp
[Fact]
public async Task Name_TooShort_ShouldFailWithCorrectMessage()
{
    var request = new CreateProductRequest { Name = "AB", Price = 10m };
    var result = await _validator.ValidateAsync(request);

    Assert.False(result.IsValid);
    Assert.True(result.HasErrorFor("Name"));
    Assert.Contains("al menos 3 caracteres", result.FirstError("Name"));
}
```

---

## Siguientes pasos

- **[Excepciones](exceptions)** — ValidationException y ValidateAndThrow
- **[ASP.NET Core](aspnetcore-integration)** — Integración con middleware y filtros
