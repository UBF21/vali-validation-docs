---
id: modifiers
title: Rule Modifiers
sidebar_position: 7
---

# Rule Modifiers

Modifiers are chained after a rule to change its behavior or error message. They apply to the **last rule** defined in the chain.

---

## WithMessage

`WithMessage` replaces the default error message of the last rule.

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
        .WithMessage("The email is required.")
    .Email()
        .WithMessage("The email format is not valid.");
```

### Placeholders

| Placeholder | Value |
|---|---|
| `{PropertyName}` | Property name (or the value of `OverridePropertyName`) |
| `{PropertyValue}` | Current value of the property |

```csharp
RuleFor(x => x.Username)
    .MaximumLength(50)
        .WithMessage("The field {PropertyName} cannot exceed 50 characters. Current value: '{PropertyValue}'.");
```

> `WithMessage` always applies to the **last rule** before it. For per-rule messages, place `WithMessage` immediately after each rule.

---

## WithErrorCode

`WithErrorCode` assigns an error code to the last rule. Codes appear in `ValidationResult.ErrorCodes`.

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
        .WithErrorCode("EMAIL_REQUIRED")
    .Email()
        .WithErrorCode("EMAIL_INVALID_FORMAT")
    .MustAsync(async (email, ct) => !await _users.ExistsByEmailAsync(email, ct))
        .WithErrorCode("EMAIL_ALREADY_EXISTS")
        .WithMessage("An account with that email already exists.");
```

Response:

```json
{
  "errors": {
    "Email": ["An account with that email already exists."]
  },
  "errorCodes": {
    "Email": ["EMAIL_ALREADY_EXISTS"]
  }
}
```

---

## OverridePropertyName

`OverridePropertyName` changes the key that appears in `ValidationResult.Errors`.

```csharp
// In the DTO the property is called Email, but the client expects "emailAddress"
RuleFor(x => x.Email)
    .NotEmpty()
    .Email()
    .OverridePropertyName("emailAddress");

// Nested property — change the full name
RuleFor(x => x.Address.PostalCode)
    .Matches(@"^\d{5}$")
    .OverridePropertyName("postalCode");
```

Result:

```json
{
  "emailAddress": ["The email field is not valid."],
  "postalCode": ["The postal code must have 5 digits."]
}
```

For complex expressions like `x => x.Name.Trim()`, the extracted property name may be incorrect. Use `OverridePropertyName` to fix it:

```csharp
RuleFor(x => x.Name.Trim())
    .NotEmpty()
    .OverridePropertyName("Name");
```

---

## StopOnFirstFailure

`StopOnFirstFailure` stops evaluation of that property's rules as soon as one fails.

```csharp
RuleFor(x => x.Email)
    .NotNull()
        .WithMessage("The email is required.")
    .NotEmpty()
        .WithMessage("The email cannot be empty.")
    .Email()
        .WithMessage("The email does not have a valid format.")
    .MustAsync(async email => !await _users.ExistsByEmailAsync(email))
        .WithMessage("That email is already registered.")
    .StopOnFirstFailure();
```

`StopOnFirstFailure` is especially important when:

1. Later rules assume earlier ones passed (e.g. `Email()` assumes the string is not null)
2. Async rules are expensive and you don't want to make unnecessary DB calls
3. Accumulated error messages would be confusing for the user

```csharp
RuleFor(x => x.ProductId)
    .NotEmpty()
        .WithMessage("The product ID is required.")
    .MustAsync(async id => await _products.ExistsAsync(id))
        .WithMessage("The product does not exist.")
    .MustAsync(async id => await _products.IsActiveAsync(id))
        .WithMessage("The product is not active.")
    .StopOnFirstFailure();
```

> This is the per-property modifier. To stop all properties after the first failure, use the global `CascadeMode`. See [CascadeMode](cascade-mode).

---

## When

`When` applies the preceding rules in the chain **only if the condition is true**.

```csharp
RuleFor(x => x.VatNumber)
    .NotEmpty()
        .WithMessage("The VAT number is required for companies.")
    .Matches(@"^[A-Z]{2}[A-Z0-9]{9}$")
        .WithMessage("The VAT number does not have the correct format.")
    .When(x => x.CustomerType == CustomerType.Company);
```

`When` applies to all rules defined in that `RuleFor`. If you want `When` to apply only to a specific rule:

```csharp
// NotEmpty always evaluated
RuleFor(x => x.VatNumber)
    .NotEmpty()
        .WithMessage("The VAT number is required.");

// Matches only for companies
RuleFor(x => x.VatNumber)
    .Matches(@"^[A-Z]{2}[A-Z0-9]{9}$")
        .WithMessage("The VAT number format is incorrect.")
    .When(x => x.CustomerType == CustomerType.Company);
```

---

## Unless

`Unless` is the negation of `When`. It applies rules if the condition is **false**.

```csharp
RuleFor(x => x.AlternativeEmail)
    .NotEmpty()
        .WithMessage("If you have no phone number, the alternative email is required.")
    .Email()
    .Unless(x => !string.IsNullOrEmpty(x.PhoneNumber));
```

---

## WhenAsync

`WhenAsync` is the async version of `When`. It allows conditions that require I/O.

```csharp
RuleFor(x => x.NewEmail)
    .NotEmpty()
    .Email()
    .MustAsync(async (email, ct) => !await _users.ExistsByEmailAsync(email, ct))
        .WithMessage("That email is already in use.")
    .WhenAsync(async (request, ct) =>
    {
        var currentUser = await _users.GetByIdAsync(request.UserId, ct);
        return currentUser?.Email != request.NewEmail;
    });
```

> **Note:** `WhenAsync` only works when `ValidateAsync` is called. Rules with `WhenAsync` are skipped when calling the synchronous `Validate`.

---

## UnlessAsync

`UnlessAsync` is the async negation of `WhenAsync`.

```csharp
RuleFor(x => x.Price)
    .GreaterThan(0)
    .UnlessAsync(async (request, ct) =>
    {
        return await _catalogs.IsFreeAsync(request.CatalogId, ct);
    });
```

---

## Combining Modifiers

```csharp
public class PaymentRequestValidator : AbstractValidator<PaymentRequest>
{
    public PaymentRequestValidator(ICurrencyService currency)
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0m)
                .WithMessage("The amount must be greater than 0.")
                .WithErrorCode("AMOUNT_MUST_BE_POSITIVE")
            .LessThanOrEqualTo(999999.99m)
                .WithMessage("The maximum amount per transaction is 999,999.99.")
                .WithErrorCode("AMOUNT_EXCEEDS_LIMIT")
            .MaxDecimalPlaces(2)
                .WithMessage("The amount cannot have more than 2 decimal places.")
            .StopOnFirstFailure();

        RuleFor(x => x.Currency)
            .NotEmpty()
                .WithErrorCode("CURRENCY_REQUIRED")
            .Uppercase()
                .WithMessage("The currency code must be uppercase (e.g.: EUR, USD).")
            .MustAsync(async (cur, ct) => await currency.IsSupportedAsync(cur, ct))
                .WithMessage("The currency '{PropertyValue}' is not supported.")
                .WithErrorCode("CURRENCY_NOT_SUPPORTED")
            .OverridePropertyName("currencyCode");

        RuleFor(x => x.CardNumber)
            .NotEmpty()
                .WithMessage("The card number is required.")
            .CreditCard()
                .WithMessage("The card number is not valid (Luhn checksum fails).")
                .WithErrorCode("INVALID_CARD_NUMBER")
            .StopOnFirstFailure()
            .When(x => x.PaymentMethod == PaymentMethod.Card);
    }
}
```

---

## Quick Summary

| Modifier | Applies to | Effect |
|---|---|---|
| `WithMessage(msg)` | Last rule | Replaces the error message |
| `WithErrorCode(code)` | Last rule | Adds code to the result |
| `OverridePropertyName(name)` | Entire builder | Changes the key in Errors |
| `StopOnFirstFailure()` | Entire builder | Stops on first failure per property |
| `When(condition)` | Entire builder | Applies only if condition is true |
| `Unless(condition)` | Entire builder | Applies only if condition is false |
| `WhenAsync(condition)` | Entire builder | Same as When but async |
| `UnlessAsync(condition)` | Entire builder | Same as Unless but async |

## Next Steps

- **[CascadeMode](cascade-mode)** — Stop evaluation at the entire validator level
- **[Validation Result](validation-result)** — How to use ErrorCodes and the rest of ValidationResult
