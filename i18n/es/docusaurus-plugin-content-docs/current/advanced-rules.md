---
id: advanced-rules
title: Reglas avanzadas
sidebar_position: 6
---

# Reglas avanzadas

Este documento cubre las reglas que van más allá de las comprobaciones estáticas: predicados personalizados, lógica asíncrona, dependencias entre propiedades, transformaciones y validadores anidados.

---

## Must

`Must` permite definir cualquier predicado síncrono.

```csharp
RuleFor(x => x.BirthDate)
    .Must(date => date.Year >= 1900)
        .WithMessage("La fecha de nacimiento no puede ser anterior a 1900.")
    .Must(date => DateTime.Today.Year - date.Year >= 18)
        .WithMessage("Debes tener al menos 18 años.");
```

`Must` también puede acceder al objeto raíz completo a través de una sobrecarga con dos parámetros:

```csharp
RuleFor(x => x.EndDate)
    .Must((request, endDate) => endDate > request.StartDate)
        .WithMessage("La fecha de fin debe ser posterior a la fecha de inicio.");
```

---

## MustAsync

`MustAsync` es la versión asíncrona de `Must`. Úsalo cuando la validación requiera I/O.

### Sin CancellationToken

```csharp
RuleFor(x => x.Email)
    .MustAsync(async email =>
    {
        var exists = await _userRepository.ExistsByEmailAsync(email);
        return !exists;
    })
    .WithMessage("Ya existe un usuario registrado con ese email.");
```

### Con CancellationToken

```csharp
RuleFor(x => x.Email)
    .MustAsync(async (email, ct) =>
    {
        var exists = await _userRepository.ExistsByEmailAsync(email, ct);
        return !exists;
    })
    .WithMessage("Ya existe un usuario registrado con ese email.");
```

### Con acceso al objeto raíz

```csharp
RuleFor(x => x.ProductId)
    .MustAsync(async (request, productId, ct) =>
    {
        var product = await _productRepository.GetByIdAsync(productId, ct);
        return product?.CategoryId == request.CategoryId;
    })
    .WithMessage("El producto no pertenece a la categoría especificada.");
```

> **Rendimiento:** Si tienes múltiples `MustAsync` independientes, considera usar `ValidateParallelAsync`. Ver [Validadores](validators).

---

## DependentRuleAsync

`DependentRuleAsync` define una regla asíncrona que depende de **dos propiedades** del mismo objeto.

```csharp
DependentRuleAsync(
    x => x.ProductId,
    x => x.WarehouseId,
    async (productId, warehouseId) =>
    {
        return await _inventory.IsProductAvailableInWarehouseAsync(productId, warehouseId);
    }
)
.WithMessage("El producto no está disponible en el almacén especificado.");
```

---

## Custom

`Custom` te da control total sobre la validación. Recibes el valor de la propiedad y un `CustomContext<T>` que te permite añadir errores de forma granular.

```csharp
RuleFor(x => x.SourceAccountId)
    .Custom(async (sourceId, ctx) =>
    {
        var request = ctx.Instance;
        var sourceAccount = await _accounts.GetByIdAsync(sourceId);

        if (sourceAccount == null)
        {
            ctx.AddFailure("SourceAccountId", "La cuenta de origen no existe.", "ACCOUNT_NOT_FOUND");
            return;
        }

        if (sourceAccount.Balance < request.Amount)
        {
            ctx.AddFailure("Amount", $"Saldo insuficiente. Disponible: {sourceAccount.Balance:C}.", "INSUFFICIENT_FUNDS");
        }
    });
```

---

## SwitchOn — Reglas condicionales por valor en una propiedad

`SwitchOn` te permite aplicar **diferentes reglas a la misma propiedad** dependiendo del valor de otra propiedad.

```csharp
public class DocumentValidator : AbstractValidator<DocumentDto>
{
    public DocumentValidator()
    {
        RuleFor(x => x.DocumentNumber)
            .SwitchOn(x => x.DocumentType)
            .Case("passport", b => b.NotEmpty().Matches(@"^[A-Z]{2}\d{6}$")
                .WithMessage("El pasaporte debe tener el formato AA999999."))
            .Case("dni",      b => b.NotEmpty().IsNumeric().MinimumLength(8).MaximumLength(8)
                .WithMessage("El DNI debe tener exactamente 8 dígitos."))
            .Case("ruc",      b => b.NotEmpty().IsNumeric().MinimumLength(11).MaximumLength(11)
                .WithMessage("El RUC debe tener exactamente 11 dígitos."))
            .Default(         b => b.NotEmpty());
    }
}
```

### Diferencia con When/Unless

| | `SwitchOn` | `When` / `Unless` |
|---|---|---|
| Exclusividad | Solo **un** caso se ejecuta | Cada bloque `When` se evalúa **independientemente** |
| Múltiples variantes | Un solo constructo cubre todas las variantes | Requiere un `RuleFor(...).When(...)` por variante |
| Solapamiento | Imposible por diseño | Posible si las condiciones no son mutuamente excluyentes |

---

## Transform

`Transform` convierte el valor de la propiedad antes de aplicar las reglas.

```csharp
// Normalizar antes de validar
RuleFor(x => x.SearchTerm)
    .Transform(term => term?.Trim().ToLowerInvariant())
    .MinimumLength(2)
    .MaximumLength(100)
    .When(x => x.SearchTerm != null);
```

```csharp
// Validar solo la extensión del archivo
RuleFor(x => x.FileName)
    .Transform(name => Path.GetExtension(name).ToLowerInvariant())
    .In(new[] { ".pdf", ".docx", ".xlsx", ".png", ".jpg" })
        .WithMessage("El formato de archivo no está permitido.");
```

---

## SetValidator

`SetValidator` delega la validación de una propiedad compleja a otro validador. Los errores aparecen con el nombre de la propiedad como prefijo.

```csharp
public class CreateShipmentValidator : AbstractValidator<CreateShipmentRequest>
{
    public CreateShipmentValidator()
    {
        RuleFor(x => x.ShippingAddress)
            .NotNull()
                .WithMessage("La dirección de envío es obligatoria.")
            .SetValidator(new AddressValidator());

        RuleFor(x => x.BillingAddress)
            .SetValidator(new AddressValidator())
            .When(x => x.BillingAddress != null);
    }
}
```

Si `ShippingAddress.Street` está vacío, el resultado contendrá:

```json
{
  "ShippingAddress.Street": ["El campo Street no puede estar vacío."]
}
```

---

## Reglas cross-property

### `GreaterThanProperty` / `GreaterThanOrEqualToProperty`

```csharp
RuleFor(x => x.EndDate)
    .GreaterThanProperty(x => x.StartDate)
        .WithMessage("La fecha de salida debe ser posterior a la fecha de entrada.");
```

### `LessThanProperty` / `LessThanOrEqualToProperty`

```csharp
RuleFor(x => x.DiscountPrice)
    .LessThanProperty(x => x.OriginalPrice)
        .WithMessage("El precio con descuento debe ser menor que el precio original.");
```

### `NotEqualToProperty`

```csharp
RuleFor(x => x.NewPassword)
    .NotEqualToProperty(x => x.OldPassword)
        .WithMessage("La nueva contraseña debe ser diferente de la actual.");
```

---

## Requerido condicional

### `RequiredIf(Func<T, bool> condition)`

```csharp
RuleFor(x => x.CompanyName)
    .RequiredIf(x => x.IsCompany)
        .WithMessage("El nombre de la empresa es obligatorio para cuentas empresariales.");
```

### `RequiredUnless(Func<T, bool> condition)`

```csharp
RuleFor(x => x.VatNumber)
    .RequiredUnless(x => x.CustomerType == "individual")
        .WithMessage("El CIF/NIF es obligatorio para facturas a empresas.");
```

---

## Siguientes pasos

- **[Modificadores](modifiers)** — WithMessage, WithErrorCode, When/Unless, OverridePropertyName
- **[Resultado de validación](validation-result)** — Cómo trabajar con ValidationResult y ErrorCodes
- **[Patrones avanzados](advanced-patterns)** — Composición de validadores, herencia, casos complejos
