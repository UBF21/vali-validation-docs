---
id: valimediator-integration
title: Integración con Vali-Mediator
sidebar_position: 14
---

# Integración con Vali-Mediator

El paquete `Vali-Validation.ValiMediator` conecta Vali-Validation con Vali-Mediator. A diferencia de la integración con MediatR (que siempre lanza `ValidationException`), este behavior detecta el tipo de retorno del handler y actúa de forma diferente según sea `Result<T>` o no.

## Instalar

```bash
dotnet add package Vali-Validation.ValiMediator
```

---

## La diferencia clave respecto a MediatR

Con **MediatR**, la validación siempre lanza una excepción:

```
Request → ValidationBehavior → falla → throw ValidationException
```

Con **Vali-Mediator**, el behavior conoce el tipo de retorno:

```
Request → ValidationBehavior → falla y TResponse es Result<T>
                                    → devuelve Result<T>.Fail(errors, ErrorType.Validation)
                              → falla y TResponse NO es Result<T>
                                    → throw ValidationException
```

Esto significa que si tu handler devuelve `Result<T>`, **nunca necesitas try/catch para errores de validación**.

---

## Métodos de registro

### Opción 1: AddValiValidationBehavior (dentro de AddValiMediator)

```csharp
builder.Services.AddValiMediator(config =>
{
    config.RegisterServicesFromAssembly(typeof(Program).Assembly);
    config.AddValiValidationBehavior();
});

builder.Services.AddValidationsFromAssembly(typeof(Program).Assembly);
```

### Opción 2: AddValiMediatorWithValidation (todo en uno)

```csharp
builder.Services.AddValiMediatorWithValidation(
    config => config.RegisterServicesFromAssembly(typeof(Program).Assembly),
    validatorsAssembly: typeof(Program).Assembly,
    lifetime: ServiceLifetime.Transient);
```

---

## Ejemplo completo con Result\<T\>

### Handler que devuelve Result\<T\>

```csharp
public class PlaceOrderHandler : IRequestHandler<PlaceOrderCommand, Result<OrderConfirmation>>
{
    public async Task<Result<OrderConfirmation>> Handle(
        PlaceOrderCommand command,
        CancellationToken ct)
    {
        // Si llegamos aquí, la validación ya pasó.
        // No se necesita try/catch para errores de validación.

        var total = await _pricing.CalculateAsync(command.Items, command.CouponCode, ct);

        if (total > 10000 && command.Items.Count > 100)
        {
            return Result<OrderConfirmation>.Fail(
                "Los pedidos con más de 100 artículos no pueden superar 10.000 €.",
                ErrorType.Validation);
        }

        var order = await _orders.CreateAsync(command, ct);
        return Result<OrderConfirmation>.Ok(new OrderConfirmation(order.Id, order.Total, DateTime.UtcNow.AddDays(3)));
    }
}
```

### Endpoint que consume Result\<T\>

```csharp
app.MapPost("/api/orders", async (
    [FromBody] PlaceOrderCommand command,
    [FromServices] IValiMediator mediator,
    CancellationToken ct) =>
{
    var result = await mediator.Send(command, ct);

    return result.Match(
        onSuccess: confirmation => Results.Created(
            $"/api/orders/{confirmation.OrderId}",
            confirmation),
        onFailure: (error, errorType) => errorType switch
        {
            ErrorType.Validation => Results.BadRequest(new { error }),
            ErrorType.NotFound   => Results.NotFound(new { error }),
            _                    => Results.Problem(error)
        });
});
```

---

## Comparación MediatR vs Vali-Mediator

| Aspecto | MediatR | Vali-Mediator |
|---|---|---|
| Fallo de validación | Lanza `ValidationException` | `Result<T>.Fail` (si devuelve `Result<T>`) |
| Handler necesita try/catch | Sí (o middleware) | No (para handlers con `Result<T>`) |
| Tipo de retorno | Cualquier tipo | `Result<T>` recomendado |
| Middleware necesario | Sí para 400 automático | Solo para handlers sin `Result<T>` |

### Patrón de código con Vali-Mediator

```csharp
// Controlador limpio, maneja Result<T> como un valor
[HttpPost]
public async Task<IActionResult> Create([FromBody] PlaceOrderCommand command)
{
    var result = await _mediator.Send(command);
    return result.IsSuccess
        ? CreatedAtAction(nameof(GetById), new { id = result.Value.OrderId }, result.Value)
        : BadRequest(new { error = result.Error });
}
```

---

## Siguientes pasos

- **[Patrones avanzados](advanced-patterns)** — Composición, herencia y casos complejos
- **[ASP.NET Core](aspnetcore-integration)** — Middleware para handlers sin Result\<T\>
- **[Resultado de validación](validation-result)** — Detalles de ValidationResult y ErrorCodes
