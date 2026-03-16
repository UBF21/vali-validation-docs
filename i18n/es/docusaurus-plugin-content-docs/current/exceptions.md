---
id: exceptions
title: Excepciones
sidebar_position: 10
---

# Excepciones de validación

## ValidationException

`ValidationException` es la excepción tipada que se lanza cuando la validación falla. Contiene el `ValidationResult` completo con todos los errores.

```csharp
public sealed class ValidationException : Exception
{
    public ValidationResult ValidationResult { get; }

    public ValidationException(ValidationResult result)
        : base("Validation failed. See ValidationResult for details.")
    {
        ValidationResult = result;
    }
}
```

### Accediendo a los errores desde la excepción

```csharp
try
{
    await validator.ValidateAndThrowAsync(request);
}
catch (ValidationException ex)
{
    // Todos los errores disponibles en ex.ValidationResult
    foreach (var (property, errors) in ex.ValidationResult.Errors)
    {
        Console.WriteLine($"{property}: {string.Join(", ", errors)}");
    }

    // O como lista plana
    var flatErrors = ex.ValidationResult.ToFlatList();
    Console.WriteLine(string.Join("\n", flatErrors));
}
```

---

## ValidateAndThrow vs ValidateAsync + comprobación manual

### Opción 1: Valor resultado

```csharp
var result = await validator.ValidateAsync(request, ct);
if (!result.IsValid)
{
    // Manejar el error sin excepción
    return new ServiceResponse { Success = false, Errors = result.Errors };
}
// Continuar con la lógica de negocio
```

### Opción 2: Excepción

```csharp
// Lanza ValidationException si !result.IsValid
await validator.ValidateAndThrowAsync(request, ct);
// Si llegamos aquí, la validación pasó
```

---

## Cuándo usar cada opción

### Usa el valor resultado cuando:

1. **Usas Vali-Mediator con `Result<T>`** — El pipeline behavior ya gestiona esto.
2. **Estás en la capa de presentación/endpoint** que quiere devolver un 400 directamente.
3. **La validación es opcional o parcial**.
4. **Necesitas combinar múltiples resultados** — usando `result.Merge()`.

### Usa ValidateAndThrow cuando:

1. **Estás en la capa de servicio** que no puede devolver un resultado HTTP directamente.
2. **Usas MediatR** con el behavior de excepción.
3. **El contrato de la función garantiza entrada válida** — lanzar simplifica el código del llamador.
4. **Quieres el patrón "fail fast"**.

---

## ValidateAndThrowAsync

```csharp
// Sin CancellationToken
await validator.ValidateAndThrowAsync(request);

// Con CancellationToken (recomendado)
await validator.ValidateAndThrowAsync(request, cancellationToken);
```

---

## ValidationException en el Middleware de ASP.NET Core

El paquete `Vali-Validation.AspNetCore` incluye un middleware que captura automáticamente `ValidationException` y devuelve HTTP 400 con formato RFC 7807:

```csharp
// Program.cs
app.UseValiValidationExceptionHandler();
```

Cuando se lanza una `ValidationException`, el middleware produce:

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation Failed",
  "status": 400,
  "errors": {
    "Email": ["El email no es válido."],
    "Password": ["La contraseña debe tener al menos 8 caracteres."]
  }
}
```

---

## Patrón recomendado por tipo de proyecto

### API REST con MediatR

```
Request → ValidationBehavior (lanza ValidationException) → Middleware (captura, devuelve 400)
```

### API REST con Vali-Mediator (Result\<T\>)

```
Request → ValidationBehavior → Si falla: Result<T>.Fail sin excepción
```

---

## Siguientes pasos

- **[Inyección de dependencias](dependency-injection)** — Cómo registrar y resolver validadores
- **[ASP.NET Core](aspnetcore-integration)** — Middleware que captura ValidationException
- **[MediatR](mediatr-integration)** — Pipeline behavior que lanza ValidationException
