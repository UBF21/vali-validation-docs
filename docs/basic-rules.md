---
id: basic-rules
title: Basic Rules
sidebar_position: 5
---

# Basic Rules

This document covers all synchronous rules available in `IRuleBuilder<T, TProperty>`. Async rules (`MustAsync`, `DependentRuleAsync`, `Custom`, `Transform`, `SetValidator`) are described in [Advanced Rules](advanced-rules).

---

## Nullability and Emptiness

### `NotNull()`

Verifies that the value is not `null`.

```csharp
RuleFor(x => x.Category).NotNull();
RuleFor(x => x.Tags).NotNull();
```

### `Null()`

Verifies that the value is `null`. Useful for validating that certain fields must NOT be sent in specific requests.

```csharp
RuleFor(x => x.UserId).Null()
    .WithMessage("Do not send the user ID in the body; it is taken from the token.");
```

### `NotEmpty()`

Verifies that the value is not `null`, not an empty string (`""`), and not only whitespace. For collections, also verifies they are not empty.

```csharp
RuleFor(x => x.Title).NotEmpty();
RuleFor(x => x.Content).NotEmpty();
```

### `Empty()`

Verifies that the value is `null` or an empty string.

```csharp
RuleFor(x => x.InternalNotes)
    .Empty()
        .WithMessage("Internal notes must not be sent from the public API.")
    .When(x => x.Source == RequestSource.PublicApi);
```

---

## Equality

### `EqualTo(TProperty value)`

```csharp
RuleFor(x => x.AcceptTerms)
    .EqualTo(true)
        .WithMessage("You must accept the terms and conditions.");
```

### `NotEqual(TProperty value)`

```csharp
RuleFor(x => x.NewPassword)
    .NotEqual("password")
        .WithMessage("Do not use 'password' as your password.");
```

### `EqualToProperty(Expression<Func<T, TProperty>> otherProp)`

Verifies that the value equals the value of another property. Ideal for password or email confirmation.

```csharp
RuleFor(x => x.ConfirmPassword)
    .NotEmpty()
    .EqualToProperty(x => x.NewPassword)
        .WithMessage("The passwords do not match.");
```

---

## String Length

### `MinimumLength(int n)`

```csharp
RuleFor(x => x.Username).MinimumLength(3);
RuleFor(x => x.Password).MinimumLength(8);
```

### `MaximumLength(int n)`

```csharp
RuleFor(x => x.Name).MaximumLength(200);
RuleFor(x => x.Email).MaximumLength(320); // RFC 5321 limit
```

### `LengthBetween(int min, int max)`

```csharp
RuleFor(x => x.PhoneNumber)
    .LengthBetween(7, 15)
        .WithMessage("The phone number must have between 7 and 15 digits.");
```

---

## Numeric Range

These rules work with `IComparable` — they work with `int`, `decimal`, `double`, `DateTime`, `long`, etc.

### `GreaterThan` / `GreaterThanOrEqualTo`

```csharp
RuleFor(x => x.Age).GreaterThan(0);
RuleFor(x => x.Stock).GreaterThanOrEqualTo(0);
```

### `LessThan` / `LessThanOrEqualTo`

```csharp
RuleFor(x => x.Age).LessThan(150);
RuleFor(x => x.Percentage).LessThanOrEqualTo(100m);
```

### `Between` / `ExclusiveBetween`

```csharp
RuleFor(x => x.Month).Between(1, 12)
    .WithMessage("The month must be between 1 and 12.");

RuleFor(x => x.Probability)
    .ExclusiveBetween(0m, 1m)
        .WithMessage("The probability must be between 0 and 1 (extremes excluded).");
```

### `Positive()`

Verifies that the number is strictly greater than 0. Zero is not positive.

```csharp
RuleFor(x => x.Price).Positive();
```

### `NonNegative()`

Verifies that the number is greater than or equal to 0 (zero is allowed).

```csharp
RuleFor(x => x.Balance).NonNegative()
    .WithMessage("The balance cannot be negative.");
```

### `Percentage()`

Verifies that the numeric value is between 0 and 100 inclusive.

```csharp
RuleFor(x => x.DiscountRate)
    .Percentage()
        .WithMessage("The discount rate must be between 0 and 100.");
```

### `Precision(int totalDigits, int decimalPlaces)`

Verifies that the decimal value fits within a `DECIMAL(totalDigits, decimalPlaces)` column.

```csharp
RuleFor(x => x.Price)
    .Precision(10, 2)
        .WithMessage("The price cannot exceed 10 significant digits with 2 decimal places.");
```

### `Negative()` / `NotZero()` / `Odd()` / `Even()` / `MultipleOf()` / `MaxDecimalPlaces()`

```csharp
RuleFor(x => x.ScaleFactor).NotZero();
RuleFor(x => x.BatchSize).Even();
RuleFor(x => x.PageSize).MultipleOf(10);
RuleFor(x => x.Price).MaxDecimalPlaces(2);
```

### `MultipleOfProperty(Expression<Func<T, TProperty>> otherExpression)`

Verifies that the value is a multiple of another property on the same object.

```csharp
RuleFor(x => x.Quantity)
    .MultipleOfProperty(x => x.MinLotSize)
        .WithMessage("The order quantity must be a multiple of the minimum lot size.");
```

---

## Strings

### `Matches(string pattern)`

```csharp
RuleFor(x => x.PostalCode)
    .Matches(@"^\d{5}(-\d{4})?$")
        .WithMessage("The postal code must be a ZIP (XXXXX or XXXXX-XXXX).");
```

### `MustContain` / `NotContains` / `StartsWith` / `EndsWith`

```csharp
RuleFor(x => x.Username)
    .NotContains("admin", StringComparison.OrdinalIgnoreCase)
        .WithMessage("The username cannot contain 'admin'.");

RuleFor(x => x.Email)
    .EndsWith("@company.com", StringComparison.OrdinalIgnoreCase)
        .WithMessage("Only corporate emails are accepted.");
```

### `IsAlpha()` / `IsAlphanumeric()` / `IsNumeric()`

```csharp
RuleFor(x => x.FirstName).IsAlpha();
RuleFor(x => x.Username).IsAlphanumeric();
RuleFor(x => x.PinCode).IsNumeric().LengthBetween(4, 6);
```

### `Lowercase()` / `Uppercase()` / `NoWhitespace()`

```csharp
RuleFor(x => x.Slug).Lowercase();
RuleFor(x => x.CountryCode).Uppercase().LengthBetween(2, 3);
RuleFor(x => x.ApiKey).NoWhitespace();
```

### `MinWords(int n)` / `MaxWords(int n)`

```csharp
RuleFor(x => x.FullName).MinWords(2)
    .WithMessage("Please enter your full name (first and last name).");
```

### `Slug()`

Verifies that the string is a valid URL slug: lowercase letters, digits and hyphens only.

```csharp
RuleFor(x => x.UrlSlug)
    .Slug()
        .WithMessage("The slug can only contain lowercase letters, numbers and hyphens.");
```

### `IsValidJson()` / `IsValidBase64()`

```csharp
RuleFor(x => x.Metadata)
    .IsValidJson()
        .WithMessage("The metadata field must contain valid JSON.");

RuleFor(x => x.FileContent)
    .IsValidBase64()
        .WithMessage("The file content must be encoded in Base64.");
```

### `NoHtmlTags()` / `NoSqlInjectionPatterns()`

```csharp
RuleFor(x => x.Comment)
    .NoHtmlTags()
        .WithMessage("The comment cannot contain HTML tags.");

RuleFor(x => x.SearchQuery)
    .NoSqlInjectionPatterns()
        .WithMessage("The search query contains forbidden characters.");
```

### `Iban()`

Verifies a valid IBAN using the mod-97 checksum algorithm.

```csharp
RuleFor(x => x.BankAccount)
    .NotEmpty()
    .Iban()
        .WithMessage("The bank account number is not a valid IBAN.");
```

---

## Format and Data Validation

### `Email()` / `Url()` / `PhoneNumber()`

```csharp
RuleFor(x => x.Email).NotEmpty().Email();
RuleFor(x => x.Website).Url();
RuleFor(x => x.PhoneNumber).PhoneNumber()
    .WithMessage("The phone number must be in E.164 format (e.g. +12025551234).");
```

### `IPv4()` / `IPv6()` / `MacAddress()`

```csharp
RuleFor(x => x.ServerIp).IPv4();
RuleFor(x => x.ServerAddress).IPv6();
RuleFor(x => x.DeviceMacAddress).MacAddress();
```

### `CreditCard()`

Verifies using the Luhn algorithm.

```csharp
RuleFor(x => x.CardNumber)
    .NotEmpty()
    .CreditCard()
        .WithMessage("The card number is not valid.");
```

### `Guid()` / `NotEmptyGuid()`

```csharp
RuleFor(x => x.ExternalId).Guid();
RuleFor(x => x.UserId).NotEmptyGuid();
```

### `IsEnum<TEnum>()`

```csharp
RuleFor(x => x.Status)
    .IsEnum<OrderStatus>()
        .WithMessage("The status must be one of: Pending, Processing, Shipped...");
```

### `CountryCode()` / `CurrencyCode()`

```csharp
RuleFor(x => x.CountryCode).CountryCode()
    .WithMessage("The country code must be a valid ISO 3166-1 alpha-2 code (e.g. US, GB, ES).");
RuleFor(x => x.Currency).CurrencyCode()
    .WithMessage("The currency must be a valid ISO 4217 code (e.g. USD, EUR, GBP).");
```

### `Latitude()` / `Longitude()`

```csharp
RuleFor(x => x.Latitude).Latitude();
RuleFor(x => x.Longitude).Longitude();
```

---

## Password and Security

### `HasUppercase()` / `HasLowercase()` / `HasDigit()` / `HasSpecialChar()`

```csharp
RuleFor(x => x.Password)
    .NotEmpty()
    .MinimumLength(8)
    .HasUppercase().WithMessage("Must contain at least one uppercase letter.")
    .HasLowercase().WithMessage("Must contain at least one lowercase letter.")
    .HasDigit().WithMessage("Must contain at least one number.")
    .HasSpecialChar().WithMessage("Must contain at least one special character.");
```

### `PasswordPolicy(...)`

A single all-in-one rule combining length, uppercase, lowercase, digit and special-character checks.

```csharp
// Default policy: 8+ chars, upper, lower, digit, special char
RuleFor(x => x.Password).PasswordPolicy();

// Stricter enterprise policy
RuleFor(x => x.Password)
    .PasswordPolicy(minLength: 12, requireSpecialChar: true)
        .WithMessage("The password does not meet the security policy.");
```

---

## Dates

### `FutureDate()` / `PastDate()` / `Today()`

```csharp
RuleFor(x => x.EventDate).FutureDate();
RuleFor(x => x.BirthDate).PastDate();
RuleFor(x => x.ReportDate).Today();
```

### `MinAge(int years)` / `MaxAge(int years)`

```csharp
RuleFor(x => x.BirthDate)
    .PastDate()
    .MinAge(18)
        .WithMessage("You must be at least 18 years old to register.");
```

### `DateBetween(DateTime from, DateTime to)`

```csharp
RuleFor(x => x.AppointmentDate)
    .DateBetween(DateTime.Today, DateTime.Today.AddMonths(3))
        .WithMessage("Appointments can be booked up to 3 months in advance.");
```

### `NotExpired()` / `WithinNext(TimeSpan)` / `WithinLast(TimeSpan)`

```csharp
RuleFor(x => x.PassportExpiryDate).NotExpired();
RuleFor(x => x.AppointmentDate).WithinNext(TimeSpan.FromDays(30));
RuleFor(x => x.TestDate).WithinLast(TimeSpan.FromDays(180));
```

### `IsWeekday()` / `IsWeekend()`

```csharp
RuleFor(x => x.AppointmentDate).IsWeekday()
    .WithMessage("Appointments can only be scheduled on weekdays (Monday–Friday).");
```

---

## Collections

### `NotEmptyCollection()` / `HasCount()` / `MinCount()` / `MaxCount()`

```csharp
RuleFor(x => x.OrderLines).NotEmptyCollection()
    .WithMessage("The order must have at least one product.");
RuleFor(x => x.Tags).MaxCount(5)
    .WithMessage("You cannot add more than 5 tags.");
```

### `Unique()`

```csharp
RuleFor(x => x.SelectedRoleIds).Unique()
    .WithMessage("The selected roles cannot be repeated.");
```

### `AllSatisfy()` / `AnySatisfy()`

```csharp
RuleFor(x => x.FileNames)
    .AllSatisfy(name => ((string)name).EndsWith(".pdf"))
        .WithMessage("All files must be PDF.");
```

### `In()` / `NotIn()`

```csharp
private static readonly string[] AllowedCurrencies = new[] { "EUR", "USD", "GBP", "JPY" };

RuleFor(x => x.Currency)
    .In(AllowedCurrencies)
        .WithMessage("The currency must be EUR, USD, GBP or JPY.");

RuleFor(x => x.Username)
    .NotIn(new[] { "admin", "root", "system" })
        .WithMessage("That username is reserved.");
```

---

## Summary of Available Rules

| Category | Rules |
|---|---|
| Null/empty | `NotNull`, `Null`, `NotEmpty`, `Empty` |
| Equality | `EqualTo`, `NotEqual`, `EqualToProperty` |
| Length | `MinimumLength`, `MaximumLength`, `LengthBetween` |
| Numeric range | `GreaterThan`, `GreaterThanOrEqualTo`, `LessThan`, `LessThanOrEqualTo`, `Between`, `ExclusiveBetween`, `Positive`, `NonNegative`, `Negative`, `NotZero`, `Odd`, `Even`, `MultipleOf`, `MultipleOfProperty`, `MaxDecimalPlaces`, `Percentage`, `Precision` |
| String | `Matches`, `MustContain`, `NotContains`, `StartsWith`, `EndsWith`, `IsAlpha`, `IsAlphanumeric`, `IsNumeric`, `Lowercase`, `Uppercase`, `NoWhitespace`, `MinWords`, `MaxWords`, `Slug`, `NoHtmlTags`, `NoSqlInjectionPatterns` |
| Format | `Email`, `Url`, `PhoneNumber`, `IPv4`, `IPv6`, `MacAddress`, `CreditCard`, `Guid`, `NotEmptyGuid`, `IsEnum<T>`, `CountryCode`, `CurrencyCode`, `Latitude`, `Longitude`, `IsValidJson`, `IsValidBase64`, `Iban` |
| Password | `HasUppercase`, `HasLowercase`, `HasDigit`, `HasSpecialChar`, `PasswordPolicy` |
| Dates | `FutureDate`, `PastDate`, `Today`, `MinAge`, `MaxAge`, `DateBetween`, `NotExpired`, `WithinNext`, `WithinLast`, `IsWeekday`, `IsWeekend` |
| Collections | `NotEmptyCollection`, `HasCount`, `MinCount`, `MaxCount`, `Unique`, `AllSatisfy`, `AnySatisfy`, `In`, `NotIn` |

## Next Steps

- **[Advanced Rules](advanced-rules)** — Must, MustAsync, Custom, Transform, SetValidator
- **[Modifiers](modifiers)** — WithMessage, WithErrorCode, When/Unless and more
