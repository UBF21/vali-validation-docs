---
id: validation-result
title: Validation Result
sidebar_position: 9
---

# Validation Result

`ValidationResult` is the object returned by `Validate()` and `ValidateAsync()`. It contains all errors found during validation, grouped by property name.

---

## Structure

```csharp
public class ValidationResult
{
    // Errors by property: { "Email": ["Invalid", "Already exists"] }
    public Dictionary<string, List<string>> Errors { get; }

    // Error codes by property: { "Email": ["INVALID_FORMAT", "ALREADY_EXISTS"] }
    public Dictionary<string, List<string>> ErrorCodes { get; }

    // true if there are no errors
    public bool IsValid { get; }

    // Total number of error messages (sum of all errors across all properties)
    public int ErrorCount { get; }

    // Names of properties that have errors
    public IReadOnlyList<string> PropertyNames { get; }
}
```

---

## IsValid and ErrorCount

```csharp
var result = await validator.ValidateAsync(request);

if (!result.IsValid)
{
    Console.WriteLine($"Validation failed with {result.ErrorCount} error(s).");
}

// IsValid is equivalent to: result.Errors.Count == 0
// ErrorCount is the total sum: if Email has 2 errors and Name has 1, ErrorCount is 3
```

---

## Accessing Errors

### By Property Directly

```csharp
if (result.Errors.TryGetValue("Email", out var emailErrors))
{
    foreach (var error in emailErrors)
        Console.WriteLine($"Email: {error}");
}
```

### Iterating All Errors

```csharp
foreach (var (propertyName, errors) in result.Errors)
{
    foreach (var error in errors)
        Console.WriteLine($"{propertyName}: {error}");
}
```

### Checking if a Property Has Errors

```csharp
bool hasEmailError = result.HasErrorFor("Email");
bool hasNameError = result.HasErrorFor("Name");
```

### Getting Errors for a Property

```csharp
// Returns an empty List<string> if there are no errors for that property
List<string> emailErrors = result.ErrorsFor("Email");
```

### Getting the First Error for a Property

```csharp
// Returns null if there are no errors for that property
string? firstError = result.FirstError("Email");
```

### PropertyNames

```csharp
IReadOnlyList<string> failedProperties = result.PropertyNames;
Console.WriteLine($"Properties with errors: {string.Join(", ", failedProperties)}");
// Output: "Properties with errors: Email, Password, BirthDate"
```

---

## AddError

`AddError` allows manually adding errors to a `ValidationResult`. Useful for combining validation with business logic:

```csharp
// Without error code
result.AddError("Email", "The email is already in use.");

// With error code
result.AddError("Email", "The email is already in use.", "EMAIL_ALREADY_EXISTS");
```

Example in a service that combines validation and business logic:

```csharp
public async Task<ValidationResult> ValidateAndCheckBusinessRulesAsync(
    CreateOrderRequest request,
    CancellationToken ct)
{
    var result = await _validator.ValidateAsync(request, ct);

    if (!result.IsValid)
        return result;

    var customer = await _customers.GetByIdAsync(request.CustomerId, ct);
    if (customer.IsBlocked)
    {
        result.AddError("CustomerId",
            "The customer is blocked and cannot place orders.",
            "CUSTOMER_BLOCKED");
    }

    return result;
}
```

---

## ToFlatList

`ToFlatList()` returns all errors as a flat list of strings in the format `"PropertyName: message"`.

```csharp
var result = await validator.ValidateAsync(request);

List<string> flatErrors = result.ToFlatList();
foreach (var error in flatErrors)
    Console.WriteLine(error);

// Output:
// Name: The name is required.
// Email: The email does not have a valid format.
// Email: The email is already registered.
// Password: Must have at least 8 characters.
```

Useful for logging:

```csharp
if (!result.IsValid)
{
    _logger.LogWarning("Validation failed: {Errors}",
        string.Join(" | ", result.ToFlatList()));
}
```

---

## Merge

`Merge` combines the errors from another `ValidationResult` into the current one:

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

`ErrorCodes` is a dictionary parallel to `Errors` that contains error codes assigned with `WithErrorCode`.

```csharp
// Check if a specific code exists
bool hasCreditLimitError = result.ErrorCodes
    .Any(kvp => kvp.Value.Contains("CREDIT_LIMIT_EXCEEDED"));
```

### Usage in a Structured API Response

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

Response:

```json
{
  "errors": {
    "Email": ["The email is already registered."],
    "Amount": ["The amount exceeds the credit limit."]
  },
  "errorCodes": {
    "Email": ["EMAIL_ALREADY_EXISTS"],
    "Amount": ["CREDIT_LIMIT_EXCEEDED"]
  }
}
```

---

## Usage in ASP.NET Core with ValidationProblem

For Minimal API, `Results.ValidationProblem` expects `Dictionary<string, string[]>`:

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

## Building ValidationResult Manually

Useful in tests or in validation orchestrators:

```csharp
var result = new ValidationResult();
result.AddError("Name", "The name is required.", "NAME_REQUIRED");
result.AddError("Email", "The email is not valid.", "EMAIL_INVALID");

Console.WriteLine(result.IsValid);      // false
Console.WriteLine(result.ErrorCount);   // 2
```

---

## Testing with ValidationResult

```csharp
[Fact]
public async Task Name_TooShort_ShouldFailWithCorrectMessage()
{
    var request = new CreateProductRequest { Name = "AB", Price = 10m };
    var result = await _validator.ValidateAsync(request);

    Assert.False(result.IsValid);
    Assert.True(result.HasErrorFor("Name"));
    Assert.Contains("at least 3 characters", result.FirstError("Name"));
}

[Fact]
public async Task ValidRequest_ShouldPass()
{
    var request = new CreateProductRequest
    {
        Name = "Laptop Pro",
        Price = 999.99m,
        Stock = 10,
        Category = "Electronics"
    };

    var result = await _validator.ValidateAsync(request);

    Assert.True(result.IsValid);
    Assert.Equal(0, result.ErrorCount);
}
```

---

## Next Steps

- **[Exceptions](exceptions)** — ValidationException and ValidateAndThrow
- **[ASP.NET Core](aspnetcore-integration)** — Integration with middleware and filters
