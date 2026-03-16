---
id: cascade-mode
title: CascadeMode
sidebar_position: 8
---

# CascadeMode

`CascadeMode` controls what happens when a rule fails: whether the remaining rules are still evaluated or evaluation is stopped. There are two levels of control:

1. **Per property** — using `.StopOnFirstFailure()` in the builder
2. **Global (entire validator)** — overriding `GlobalCascadeMode`

---

## The Two Modes

```csharp
public enum CascadeMode
{
    Continue,          // Default: evaluates all rules even if some fail
    StopOnFirstFailure // Stops on first failure per property or per validator
}
```

---

## Per-Property CascadeMode

When you use `.StopOnFirstFailure()` in a builder, evaluation of that property stops after the first failure. Other properties in the validator **are still evaluated**.

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
        .WithMessage("The email is required.")
    .Email()
        .WithMessage("The email does not have a valid format.")
    .MustAsync(async (email, ct) =>
        !await _users.EmailExistsAsync(email, ct))
        .WithMessage("That email is already registered.")
    .StopOnFirstFailure();

// Password IS evaluated normally even if Email fails
RuleFor(x => x.Password)
    .NotEmpty()
    .MinimumLength(8);
```

### Why It Is Important

Without `StopOnFirstFailure`, if email is `null`:

```
Email: The email is required.
Email: The email does not have a valid format.
Email: <MustAsync might throw NullReferenceException>
```

With `StopOnFirstFailure`, if email is `null`:

```
Email: The email is required.
```

Only the first error. The following rules do not execute.

```csharp
// Avoid expensive calls if basic validation already failed
RuleFor(x => x.ProductId)
    .NotEmpty()
        .WithMessage("The product ID is required.")
    .MustAsync(async id => await _products.ExistsAsync(id))
        .WithMessage("The product does not exist.")
    .MustAsync(async id => await _products.IsActiveAsync(id))
        .WithMessage("The product is not active.")
    .StopOnFirstFailure();
```

---

## Global CascadeMode

The global mode applies to **the entire validator**. When `StopOnFirstFailure` is activated globally, if the first **property** evaluated has an error, subsequent properties **are not evaluated**.

### Activating Global Mode

```csharp
public class StrictPaymentValidator : AbstractValidator<PaymentRequest>
{
    protected override CascadeMode GlobalCascadeMode => CascadeMode.StopOnFirstFailure;

    public StrictPaymentValidator()
    {
        RuleFor(x => x.CardNumber)
            .NotEmpty()
            .CreditCard();

        RuleFor(x => x.Amount)
            .GreaterThan(0);

        // If CardNumber fails, Amount is not evaluated
    }
}
```

### Visual Difference Between Modes

Given this invalid request:

```csharp
var request = new PaymentRequest
{
    CardNumber = "",    // Fails
    Amount = -10,       // Also fails
    Currency = ""       // Also fails
};
```

**With `CascadeMode.Continue` (default):**

```json
{
  "CardNumber": ["The card number is required."],
  "Amount": ["The amount must be positive."],
  "Currency": ["The currency is required."]
}
```

**With `GlobalCascadeMode = CascadeMode.StopOnFirstFailure`:**

```json
{
  "CardNumber": ["The card number is required."]
}
```

Only the error from the first property that fails.

---

## Combining Both Levels

You can use both levels simultaneously — global `Continue` mode but `StopOnFirstFailure` on specific properties:

```csharp
public class CreateOrderValidator : AbstractValidator<CreateOrderRequest>
{
    // Global mode: evaluates all properties even if some fail
    protected override CascadeMode GlobalCascadeMode => CascadeMode.Continue;

    public CreateOrderValidator()
    {
        // This property stops on first failure (avoids DB call if empty)
        RuleFor(x => x.CustomerId)
            .NotEmpty()
            .MustAsync(async id => await _customers.ExistsAsync(id))
            .StopOnFirstFailure();

        // This property also stops (avoids NRE if Card is null)
        RuleFor(x => x.CardNumber)
            .NotEmpty()
            .CreditCard()
            .StopOnFirstFailure();

        // This property evaluates all its rules (default mode)
        RuleFor(x => x.Notes)
            .MaximumLength(500)
            .NoWhitespace();
    }
}
```

---

## When to Use Each Mode

### Use `StopOnFirstFailure` per property when:

1. **Later rules may throw exceptions** if earlier ones did not pass (e.g. `null` in a rule that expects a string)
2. **There are expensive async rules** that should not run if a basic validation already failed
3. **Accumulated messages would be confusing** (e.g. "is null" and "format is invalid" for the same field)

### Use `GlobalCascadeMode = StopOnFirstFailure` when:

1. **Validation of the first field is a prerequisite** for the others
2. **Performance is critical** and you want to minimize validation work
3. **You prefer incremental feedback** (one property at a time) instead of all errors at once

### Use `Continue` (default) when:

1. **You want to show all errors at once** (better UX in forms)
2. **Rules are independent** and there is no risk of cascading exceptions
3. **You are in an API** where the client wants to know all problems with the request

---

## Comparative Example: Registration Form

```csharp
// Form UX: show all errors to the user at once
public class RegistrationFormValidator : AbstractValidator<RegistrationForm>
{
    public RegistrationFormValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().Email().StopOnFirstFailure();

        RuleFor(x => x.Password)
            .NotEmpty().MinimumLength(8).HasUppercase().HasLowercase().HasDigit().HasSpecialChar();
        // No StopOnFirstFailure: the user will see all requirements they do not meet

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty()
            .EqualToProperty(x => x.Password)
            .StopOnFirstFailure();
    }
}
```

With `Password = "abc"` (no uppercase, no digit, no special character):

```json
{
  "Password": [
    "The password must have at least 8 characters.",
    "Must contain at least one uppercase letter.",
    "Must contain at least one number.",
    "Must contain at least one special character."
  ]
}
```

---

## Next Steps

- **[Validation Result](validation-result)** — How to read and use ValidationResult
- **[Modifiers](modifiers)** — StopOnFirstFailure and other modifiers in detail
