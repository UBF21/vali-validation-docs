---
id: modifiers
title: Modificadores de reglas
sidebar_position: 7
---

# Modificadores de reglas

Los modificadores se encadenan después de una regla para cambiar su comportamiento o mensaje de error. Se aplican a la **última regla** definida en la cadena.

---

## WithMessage

`WithMessage` reemplaza el mensaje de error por defecto de la última regla.

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
        .WithMessage("El email es obligatorio.")
    .Email()
        .WithMessage("El formato de email no es válido.");
```

### Placeholders

| Placeholder | Valor |
|---|---|
| `{PropertyName}` | Nombre de la propiedad (o el valor de `OverridePropertyName`) |
| `{PropertyValue}` | Valor actual de la propiedad |

```csharp
RuleFor(x => x.Username)
    .MaximumLength(50)
        .WithMessage("El campo {PropertyName} no puede superar 50 caracteres. Valor actual: '{PropertyValue}'.");
```

---

## WithErrorCode

`WithErrorCode` asigna un código de error a la última regla. Los códigos aparecen en `ValidationResult.ErrorCodes`.

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
        .WithErrorCode("EMAIL_REQUIRED")
    .Email()
        .WithErrorCode("EMAIL_INVALID_FORMAT")
    .MustAsync(async (email, ct) => !await _users.ExistsByEmailAsync(email, ct))
        .WithErrorCode("EMAIL_ALREADY_EXISTS")
        .WithMessage("Ya existe una cuenta con ese email.");
```

---

## OverridePropertyName

`OverridePropertyName` cambia la clave que aparece en `ValidationResult.Errors`.

```csharp
// En el DTO la propiedad se llama Email, pero el cliente espera "emailAddress"
RuleFor(x => x.Email)
    .NotEmpty()
    .Email()
    .OverridePropertyName("emailAddress");
```

---

## StopOnFirstFailure

`StopOnFirstFailure` detiene la evaluación de las reglas de esa propiedad en cuanto una falla.

```csharp
RuleFor(x => x.Email)
    .NotNull()
        .WithMessage("El email es obligatorio.")
    .NotEmpty()
        .WithMessage("El email no puede estar vacío.")
    .Email()
        .WithMessage("El email no tiene un formato válido.")
    .MustAsync(async email => !await _users.ExistsByEmailAsync(email))
        .WithMessage("Ese email ya está registrado.")
    .StopOnFirstFailure();
```

> Este es el modificador por propiedad. Para detener todas las propiedades tras el primer fallo, usa el `CascadeMode` global. Ver [CascadeMode](cascade-mode).

---

## When

`When` aplica las reglas anteriores de la cadena **solo si la condición es verdadera**.

```csharp
RuleFor(x => x.VatNumber)
    .NotEmpty()
        .WithMessage("El CIF/NIF es obligatorio para empresas.")
    .Matches(@"^[A-Z][0-9]{7}[A-Z0-9]$")
        .WithMessage("El CIF/NIF no tiene el formato correcto.")
    .When(x => x.CustomerType == CustomerType.Company);
```

---

## Unless

`Unless` es la negación de `When`. Aplica las reglas si la condición es **falsa**.

```csharp
RuleFor(x => x.AlternativeEmail)
    .NotEmpty()
        .WithMessage("Si no tienes teléfono, el email alternativo es obligatorio.")
    .Email()
    .Unless(x => !string.IsNullOrEmpty(x.PhoneNumber));
```

---

## WhenAsync

`WhenAsync` es la versión asíncrona de `When`. Permite condiciones que requieren I/O.

```csharp
RuleFor(x => x.NewEmail)
    .NotEmpty()
    .Email()
    .MustAsync(async (email, ct) => !await _users.ExistsByEmailAsync(email, ct))
        .WithMessage("Ese email ya está en uso.")
    .WhenAsync(async (request, ct) =>
    {
        var currentUser = await _users.GetByIdAsync(request.UserId, ct);
        return currentUser?.Email != request.NewEmail;
    });
```

> **Nota:** `WhenAsync` solo funciona cuando se llama a `ValidateAsync`. Las reglas con `WhenAsync` se omiten al llamar al `Validate` síncrono.

---

## UnlessAsync

`UnlessAsync` es la negación asíncrona de `WhenAsync`.

```csharp
RuleFor(x => x.Price)
    .GreaterThan(0)
    .UnlessAsync(async (request, ct) =>
    {
        return await _catalogs.IsFreeAsync(request.CatalogId, ct);
    });
```

---

## Combinando modificadores

```csharp
public class PaymentRequestValidator : AbstractValidator<PaymentRequest>
{
    public PaymentRequestValidator(ICurrencyService currency)
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0m)
                .WithMessage("El importe debe ser mayor que 0.")
                .WithErrorCode("AMOUNT_MUST_BE_POSITIVE")
            .LessThanOrEqualTo(999999.99m)
                .WithMessage("El importe máximo por transacción es 999.999,99.")
                .WithErrorCode("AMOUNT_EXCEEDS_LIMIT")
            .MaxDecimalPlaces(2)
                .WithMessage("El importe no puede tener más de 2 decimales.")
            .StopOnFirstFailure();

        RuleFor(x => x.Currency)
            .NotEmpty()
                .WithErrorCode("CURRENCY_REQUIRED")
            .Uppercase()
                .WithMessage("El código de moneda debe ser en mayúsculas (ej: EUR, USD).")
            .MustAsync(async (cur, ct) => await currency.IsSupportedAsync(cur, ct))
                .WithMessage("La moneda '{PropertyValue}' no está soportada.")
                .WithErrorCode("CURRENCY_NOT_SUPPORTED")
            .OverridePropertyName("currencyCode");
    }
}
```

---

## Resumen rápido

| Modificador | Se aplica a | Efecto |
|---|---|---|
| `WithMessage(msg)` | Última regla | Reemplaza el mensaje de error |
| `WithErrorCode(code)` | Última regla | Añade código al resultado |
| `OverridePropertyName(name)` | Builder completo | Cambia la clave en Errors |
| `StopOnFirstFailure()` | Builder completo | Detiene tras primer fallo por propiedad |
| `When(condition)` | Builder completo | Solo aplica si la condición es verdadera |
| `Unless(condition)` | Builder completo | Solo aplica si la condición es falsa |
| `WhenAsync(condition)` | Builder completo | Igual que When pero asíncrono |
| `UnlessAsync(condition)` | Builder completo | Igual que Unless pero asíncrono |

## Siguientes pasos

- **[CascadeMode](cascade-mode)** — Detener la evaluación a nivel del validador completo
- **[Resultado de validación](validation-result)** — Cómo usar ErrorCodes y el resto de ValidationResult
