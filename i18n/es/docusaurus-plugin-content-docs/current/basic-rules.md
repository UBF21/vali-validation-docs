---
id: basic-rules
title: Reglas básicas
sidebar_position: 5
---

# Reglas básicas

Este documento cubre todas las reglas síncronas disponibles en `IRuleBuilder<T, TProperty>`. Las reglas asíncronas (`MustAsync`, `DependentRuleAsync`, `Custom`, `Transform`, `SetValidator`) se describen en [Reglas avanzadas](advanced-rules).

---

## Nulidad y vacío

### `NotNull()`

Verifica que el valor no sea `null`.

```csharp
RuleFor(x => x.Category).NotNull();
RuleFor(x => x.Tags).NotNull();
```

### `Null()`

Verifica que el valor sea `null`. Útil para validar que ciertos campos NO deben enviarse.

```csharp
RuleFor(x => x.UserId).Null()
    .WithMessage("No envíes el ID de usuario en el body; se toma del token.");
```

### `NotEmpty()`

Verifica que el valor no sea `null`, no sea string vacío (`""`), y no sea solo espacios en blanco.

```csharp
RuleFor(x => x.Title).NotEmpty();
RuleFor(x => x.Content).NotEmpty();
```

### `Empty()`

Verifica que el valor sea `null` o string vacío.

```csharp
RuleFor(x => x.InternalNotes)
    .Empty()
        .WithMessage("Las notas internas no deben enviarse desde la API pública.")
    .When(x => x.Source == RequestSource.PublicApi);
```

---

## Igualdad

### `EqualTo(TProperty value)`

```csharp
RuleFor(x => x.AcceptTerms)
    .EqualTo(true)
        .WithMessage("Debes aceptar los términos y condiciones.");
```

### `NotEqual(TProperty value)`

```csharp
RuleFor(x => x.NewPassword)
    .NotEqual("password")
        .WithMessage("No uses 'password' como contraseña.");
```

### `EqualToProperty(Expression<Func<T, TProperty>> otherProp)`

```csharp
RuleFor(x => x.ConfirmPassword)
    .NotEmpty()
    .EqualToProperty(x => x.NewPassword)
        .WithMessage("Las contraseñas no coinciden.");
```

---

## Longitud de cadenas

### `MinimumLength(int n)`

```csharp
RuleFor(x => x.Username).MinimumLength(3);
RuleFor(x => x.Password).MinimumLength(8);
```

### `MaximumLength(int n)`

```csharp
RuleFor(x => x.Name).MaximumLength(200);
RuleFor(x => x.Email).MaximumLength(320);
```

### `LengthBetween(int min, int max)`

```csharp
RuleFor(x => x.PhoneNumber)
    .LengthBetween(7, 15)
        .WithMessage("El número de teléfono debe tener entre 7 y 15 dígitos.");
```

---

## Rango numérico

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
    .WithMessage("El mes debe estar entre 1 y 12.");

RuleFor(x => x.Probability)
    .ExclusiveBetween(0m, 1m)
        .WithMessage("La probabilidad debe estar entre 0 y 1 (extremos excluidos).");
```

### `Positive()` / `NonNegative()` / `Negative()` / `NotZero()`

```csharp
RuleFor(x => x.Price).Positive();
RuleFor(x => x.Balance).NonNegative()
    .WithMessage("El saldo no puede ser negativo.");
```

### `Percentage()`

```csharp
RuleFor(x => x.DiscountRate)
    .Percentage()
        .WithMessage("El porcentaje de descuento debe estar entre 0 y 100.");
```

### `Precision(int totalDigits, int decimalPlaces)`

```csharp
RuleFor(x => x.Price)
    .Precision(10, 2)
        .WithMessage("El precio no puede superar 10 dígitos significativos con 2 decimales.");
```

### `Odd()` / `Even()` / `MultipleOf()` / `MaxDecimalPlaces()`

```csharp
RuleFor(x => x.BatchSize).Even();
RuleFor(x => x.PageSize).MultipleOf(10);
RuleFor(x => x.Price).MaxDecimalPlaces(2);
```

---

## Cadenas de texto

### `Matches(string pattern)`

```csharp
RuleFor(x => x.PostalCode)
    .Matches(@"^\d{5}(-\d{4})?$")
        .WithMessage("El código postal debe ser un ZIP (XXXXX o XXXXX-XXXX).");
```

### `MustContain` / `NotContains` / `StartsWith` / `EndsWith`

```csharp
RuleFor(x => x.Username)
    .NotContains("admin", StringComparison.OrdinalIgnoreCase)
        .WithMessage("El nombre de usuario no puede contener 'admin'.");

RuleFor(x => x.Email)
    .EndsWith("@empresa.com", StringComparison.OrdinalIgnoreCase)
        .WithMessage("Solo se aceptan emails corporativos.");
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
    .WithMessage("Introduce tu nombre completo (nombre y apellido).");
```

### `Slug()`

```csharp
RuleFor(x => x.UrlSlug)
    .Slug()
        .WithMessage("El slug solo puede contener letras minúsculas, números y guiones.");
```

### `IsValidJson()` / `IsValidBase64()`

```csharp
RuleFor(x => x.Metadata).IsValidJson();
RuleFor(x => x.FileContent).IsValidBase64();
```

### `NoHtmlTags()` / `NoSqlInjectionPatterns()`

```csharp
RuleFor(x => x.Comment).NoHtmlTags();
RuleFor(x => x.SearchQuery).NoSqlInjectionPatterns();
```

### `Iban()`

```csharp
RuleFor(x => x.BankAccount).NotEmpty().Iban()
    .WithMessage("El número de cuenta bancaria no es un IBAN válido.");
```

---

## Formato y datos

### `Email()` / `Url()` / `PhoneNumber()`

```csharp
RuleFor(x => x.Email).NotEmpty().Email();
RuleFor(x => x.Website).Url();
RuleFor(x => x.PhoneNumber).PhoneNumber()
    .WithMessage("El teléfono debe estar en formato E.164 (ej: +34612345678).");
```

### `IPv4()` / `IPv6()` / `MacAddress()`

```csharp
RuleFor(x => x.ServerIp).IPv4();
RuleFor(x => x.DeviceMacAddress).MacAddress();
```

### `CreditCard()`

```csharp
RuleFor(x => x.CardNumber).NotEmpty().CreditCard()
    .WithMessage("El número de tarjeta no es válido.");
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
        .WithMessage("El estado debe ser uno de: Pending, Processing, Shipped...");
```

### `CountryCode()` / `CurrencyCode()`

```csharp
RuleFor(x => x.CountryCode).CountryCode()
    .WithMessage("El código de país debe ser un código ISO 3166-1 alpha-2 válido (ej: ES, US, GB).");
RuleFor(x => x.Currency).CurrencyCode()
    .WithMessage("La moneda debe ser un código ISO 4217 válido (ej: EUR, USD, GBP).");
```

### `Latitude()` / `Longitude()`

```csharp
RuleFor(x => x.Latitude).Latitude();
RuleFor(x => x.Longitude).Longitude();
```

---

## Contraseña y seguridad

### `HasUppercase()` / `HasLowercase()` / `HasDigit()` / `HasSpecialChar()`

```csharp
RuleFor(x => x.Password)
    .NotEmpty()
    .MinimumLength(8)
    .HasUppercase().WithMessage("Debe contener al menos una mayúscula.")
    .HasLowercase().WithMessage("Debe contener al menos una minúscula.")
    .HasDigit().WithMessage("Debe contener al menos un número.")
    .HasSpecialChar().WithMessage("Debe contener al menos un carácter especial.");
```

### `PasswordPolicy(...)`

```csharp
// Política por defecto: 8+ chars, mayúscula, minúscula, dígito, carácter especial
RuleFor(x => x.Password).PasswordPolicy();

// Política más estricta
RuleFor(x => x.Password)
    .PasswordPolicy(minLength: 12, requireSpecialChar: true)
        .WithMessage("La contraseña no cumple la política de seguridad.");
```

---

## Fechas

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
        .WithMessage("Debes tener al menos 18 años para registrarte.");
```

### `DateBetween(DateTime from, DateTime to)`

```csharp
RuleFor(x => x.AppointmentDate)
    .DateBetween(DateTime.Today, DateTime.Today.AddMonths(3))
        .WithMessage("Las citas se pueden reservar con hasta 3 meses de antelación.");
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
    .WithMessage("Las citas solo se pueden programar en días laborables (lunes–viernes).");
```

---

## Colecciones

### `NotEmptyCollection()` / `HasCount()` / `MinCount()` / `MaxCount()`

```csharp
RuleFor(x => x.OrderLines).NotEmptyCollection()
    .WithMessage("El pedido debe tener al menos un producto.");
RuleFor(x => x.Tags).MaxCount(5)
    .WithMessage("No puedes agregar más de 5 etiquetas.");
```

### `Unique()`

```csharp
RuleFor(x => x.SelectedRoleIds).Unique()
    .WithMessage("Los roles seleccionados no pueden repetirse.");
```

### `AllSatisfy()` / `AnySatisfy()`

```csharp
RuleFor(x => x.FileNames)
    .AllSatisfy(name => ((string)name).EndsWith(".pdf"))
        .WithMessage("Todos los archivos deben ser PDF.");
```

### `In()` / `NotIn()`

```csharp
RuleFor(x => x.Currency)
    .In(new[] { "EUR", "USD", "GBP", "JPY" })
        .WithMessage("La moneda debe ser EUR, USD, GBP o JPY.");

RuleFor(x => x.Username)
    .NotIn(new[] { "admin", "root", "system" })
        .WithMessage("Ese nombre de usuario está reservado.");
```

---

## Resumen de reglas disponibles

| Categoría | Reglas |
|---|---|
| Null/vacío | `NotNull`, `Null`, `NotEmpty`, `Empty` |
| Igualdad | `EqualTo`, `NotEqual`, `EqualToProperty` |
| Longitud | `MinimumLength`, `MaximumLength`, `LengthBetween` |
| Rango numérico | `GreaterThan`, `GreaterThanOrEqualTo`, `LessThan`, `LessThanOrEqualTo`, `Between`, `ExclusiveBetween`, `Positive`, `NonNegative`, `Negative`, `NotZero`, `Odd`, `Even`, `MultipleOf`, `MultipleOfProperty`, `MaxDecimalPlaces`, `Percentage`, `Precision` |
| Cadenas | `Matches`, `MustContain`, `NotContains`, `StartsWith`, `EndsWith`, `IsAlpha`, `IsAlphanumeric`, `IsNumeric`, `Lowercase`, `Uppercase`, `NoWhitespace`, `MinWords`, `MaxWords`, `Slug`, `NoHtmlTags`, `NoSqlInjectionPatterns` |
| Formato | `Email`, `Url`, `PhoneNumber`, `IPv4`, `IPv6`, `MacAddress`, `CreditCard`, `Guid`, `NotEmptyGuid`, `IsEnum<T>`, `CountryCode`, `CurrencyCode`, `Latitude`, `Longitude`, `IsValidJson`, `IsValidBase64`, `Iban` |
| Contraseña | `HasUppercase`, `HasLowercase`, `HasDigit`, `HasSpecialChar`, `PasswordPolicy` |
| Fechas | `FutureDate`, `PastDate`, `Today`, `MinAge`, `MaxAge`, `DateBetween`, `NotExpired`, `WithinNext`, `WithinLast`, `IsWeekday`, `IsWeekend` |
| Colecciones | `NotEmptyCollection`, `HasCount`, `MinCount`, `MaxCount`, `Unique`, `AllSatisfy`, `AnySatisfy`, `In`, `NotIn` |

## Siguientes pasos

- **[Reglas avanzadas](advanced-rules)** — Must, MustAsync, Custom, Transform, SetValidator
- **[Modificadores](modifiers)** — WithMessage, WithErrorCode, When/Unless y más
