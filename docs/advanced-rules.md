---
id: advanced-rules
title: Advanced Rules
sidebar_position: 6
---

# Advanced Rules

This document covers rules that go beyond static checks: custom predicates, async logic, cross-property dependencies, transformations and nested validators.

---

## Must

`Must` lets you define any synchronous predicate.

```csharp
RuleFor(x => x.BirthDate)
    .Must(date => date.Year >= 1900)
        .WithMessage("The birth date cannot be before 1900.")
    .Must(date => DateTime.Today.Year - date.Year >= 18)
        .WithMessage("You must be at least 18 years old.");
```

`Must` can also access the full root object through a two-parameter overload:

```csharp
RuleFor(x => x.EndDate)
    .Must((request, endDate) => endDate > request.StartDate)
        .WithMessage("The end date must be after the start date.");
```

---

## MustAsync

`MustAsync` is the async version of `Must`. Use it when validation requires I/O: database queries, external API calls, etc.

### Without CancellationToken

```csharp
RuleFor(x => x.Email)
    .MustAsync(async email =>
    {
        var exists = await _userRepository.ExistsByEmailAsync(email);
        return !exists;
    })
    .WithMessage("A user is already registered with that email.");
```

### With CancellationToken

```csharp
RuleFor(x => x.Email)
    .MustAsync(async (email, ct) =>
    {
        var exists = await _userRepository.ExistsByEmailAsync(email, ct);
        return !exists;
    })
    .WithMessage("A user is already registered with that email.");
```

### With Access to the Root Object

```csharp
RuleFor(x => x.ProductId)
    .MustAsync(async (request, productId, ct) =>
    {
        var product = await _productRepository.GetByIdAsync(productId, ct);
        return product?.CategoryId == request.CategoryId;
    })
    .WithMessage("The product does not belong to the specified category.");
```

> **Performance:** If you have multiple independent `MustAsync` calls, consider using `ValidateParallelAsync` to execute them in parallel. See [Validators](validators).

---

## DependentRuleAsync

`DependentRuleAsync` defines an async rule that depends on **two properties** of the same object.

```csharp
DependentRuleAsync(
    x => x.ProductId,
    x => x.WarehouseId,
    async (productId, warehouseId) =>
    {
        return await _inventory.IsProductAvailableInWarehouseAsync(productId, warehouseId);
    }
)
.WithMessage("The product is not available in the specified warehouse.");
```

---

## Custom

`Custom` gives full control over validation. You receive the property value and a `CustomContext<T>` that allows you to add errors in a granular way.

### CustomContext\<T\> Interface

```csharp
// ctx.Instance — the full T object
// ctx.AddFailure(message) — adds an error to the current property
// ctx.AddFailure(property, message) — adds an error to a specific property
// ctx.AddFailure(property, message, errorCode) — with error code
```

### Example: Complex Cross-Property Validation

```csharp
RuleFor(x => x.SourceAccountId)
    .Custom(async (sourceId, ctx) =>
    {
        var request = ctx.Instance;
        var sourceAccount = await _accounts.GetByIdAsync(sourceId);

        if (sourceAccount == null)
        {
            ctx.AddFailure("SourceAccountId", "The source account does not exist.", "ACCOUNT_NOT_FOUND");
            return;
        }

        if (sourceAccount.Balance < request.Amount)
        {
            ctx.AddFailure("Amount", $"Insufficient balance. Available: {sourceAccount.Balance:C}.", "INSUFFICIENT_FUNDS");
        }
    });
```

---

## SwitchOn — Conditional Rules by Value on a Property

`SwitchOn` lets you apply **different rules to the same property** depending on the value of another property.

### Syntax

```csharp
RuleFor(x => x.TargetProperty)
    .SwitchOn(x => x.DiscriminatorProperty)
    .Case(value1, b => b.Rule1().Rule2())
    .Case(value2, b => b.Rule3())
    .Default(     b => b.FallbackRule());
```

### Complete Example: Document Validator

```csharp
public class DocumentValidator : AbstractValidator<DocumentDto>
{
    public DocumentValidator()
    {
        RuleFor(x => x.DocumentNumber)
            .SwitchOn(x => x.DocumentType)
            .Case("passport", b => b.NotEmpty().Matches(@"^[A-Z]{2}\d{6}$")
                .WithMessage("The passport number must have the format AA999999."))
            .Case("dni",      b => b.NotEmpty().IsNumeric().MinimumLength(8).MaximumLength(8)
                .WithMessage("The DNI must be exactly 8 digits."))
            .Case("ruc",      b => b.NotEmpty().IsNumeric().MinimumLength(11).MaximumLength(11)
                .WithMessage("The RUC must be exactly 11 digits."))
            .Default(         b => b.NotEmpty());
    }
}
```

### Difference from When/Unless

| | `SwitchOn` | `When` / `Unless` |
|---|---|---|
| Exclusivity | Only **one** case runs | Each `When` block is evaluated **independently** |
| Multiple variants | One construct covers all variants | Requires one `RuleFor(...).When(...)` per variant |
| Overlap | Impossible by design | Possible if conditions are not mutually exclusive |

---

## Transform

`Transform` converts the property value before applying rules.

### Normalize Before Validating

```csharp
RuleFor(x => x.SearchTerm)
    .Transform(term => term?.Trim().ToLowerInvariant())
    .MinimumLength(2)
    .MaximumLength(100)
    .When(x => x.SearchTerm != null);
```

### Extract Part of the Value

```csharp
// Validates only the file extension
RuleFor(x => x.FileName)
    .Transform(name => Path.GetExtension(name).ToLowerInvariant())
    .In(new[] { ".pdf", ".docx", ".xlsx", ".png", ".jpg" })
        .WithMessage("The file format is not allowed.");
```

### Type Conversion

```csharp
RuleFor(x => x.AmountString)
    .Transform(s => decimal.TryParse(s, out var result) ? result : -1m)
    .GreaterThan(0m)
        .WithMessage("The amount must be a positive number.")
    .MaxDecimalPlaces(2);
```

---

## SetValidator

`SetValidator` delegates validation of a complex property to another validator. Errors appear with the property name as prefix.

```csharp
public class CreateShipmentValidator : AbstractValidator<CreateShipmentRequest>
{
    public CreateShipmentValidator()
    {
        RuleFor(x => x.ShippingAddress)
            .NotNull()
                .WithMessage("The shipping address is required.")
            .SetValidator(new AddressValidator());

        RuleFor(x => x.BillingAddress)
            .SetValidator(new AddressValidator())
            .When(x => x.BillingAddress != null);
    }
}
```

If `ShippingAddress.Street` is empty, the result will contain:

```json
{
  "ShippingAddress.Street": ["The Street field cannot be empty."]
}
```

---

## Cross-Property Rules

These rules compare a property against **another property on the same object**.

### `GreaterThanProperty` / `GreaterThanOrEqualToProperty`

```csharp
RuleFor(x => x.EndDate)
    .GreaterThanProperty(x => x.StartDate)
        .WithMessage("The check-out date must be after the check-in date.");

RuleFor(x => x.MaxPrice)
    .GreaterThanOrEqualToProperty(x => x.MinPrice)
        .WithMessage("The maximum price must be greater than or equal to the minimum price.");
```

### `LessThanProperty` / `LessThanOrEqualToProperty`

```csharp
RuleFor(x => x.DiscountPrice)
    .LessThanProperty(x => x.OriginalPrice)
        .WithMessage("The discounted price must be lower than the original price.");

RuleFor(x => x.ActualCost)
    .LessThanOrEqualToProperty(x => x.BudgetCap)
        .WithMessage("The actual cost cannot exceed the budget cap.");
```

### `NotEqualToProperty`

```csharp
RuleFor(x => x.NewPassword)
    .NotEqualToProperty(x => x.OldPassword)
        .WithMessage("The new password must be different from the current password.");
```

### `MultipleOfProperty`

```csharp
RuleFor(x => x.Quantity)
    .Positive()
    .MultipleOfProperty(x => x.MinLotSize)
        .WithMessage("The quantity must be a multiple of the minimum lot size.");
```

---

## Conditional Required

### `RequiredIf(Func<T, bool> condition)`

The field is required when the condition evaluates to `true`.

```csharp
RuleFor(x => x.CompanyName)
    .RequiredIf(x => x.IsCompany)
        .WithMessage("The company name is required for company accounts.");
```

### `RequiredIf<TOther>(Expression otherProperty, TOther expectedValue)`

```csharp
RuleFor(x => x.ShippingAddress)
    .RequiredIf(x => x.DeliveryMethod, "delivery")
        .WithMessage("A shipping address is required for home delivery.");
```

### `RequiredUnless(Func<T, bool> condition)`

```csharp
RuleFor(x => x.VatNumber)
    .RequiredUnless(x => x.CustomerType == "individual")
        .WithMessage("A VAT number is required for business invoices.");
```

---

## Next Steps

- **[Modifiers](modifiers)** — WithMessage, WithErrorCode, When/Unless, OverridePropertyName
- **[Validation Result](validation-result)** — How to work with ValidationResult and ErrorCodes
- **[Advanced Patterns](advanced-patterns)** — Validator composition, inheritance, complex cases
