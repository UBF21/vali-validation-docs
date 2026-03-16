---
id: validators
title: Validadores
sidebar_position: 4
---

# Validadores

## AbstractValidator\<T\>

`AbstractValidator<T>` es la clase base que debes heredar para crear cualquier validador. Es donde defines todas las reglas usando el método `RuleFor`.

### Estructura básica

```csharp
public class OrderValidator : AbstractValidator<Order>
{
    public OrderValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.TotalAmount).GreaterThan(0);
        RuleFor(x => x.Items).NotEmptyCollection();
    }
}
```

### Inyección de dependencias en el constructor

Los validadores pueden recibir dependencias en el constructor:

```csharp
public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    private readonly IUserRepository _userRepository;

    public CreateUserValidator(IUserRepository userRepository)
    {
        _userRepository = userRepository;

        RuleFor(x => x.Email)
            .NotEmpty()
            .Email()
            .MustAsync(async email =>
            {
                var exists = await _userRepository.ExistsByEmailAsync(email);
                return !exists;
            })
            .WithMessage("Ya existe un usuario con ese email.");
    }
}
```

---

## RuleFor

`RuleFor` acepta una expresión que selecciona la propiedad a validar:

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
    .Email()
    .MaximumLength(320);
```

---

## RuleForEach

`RuleForEach` valida cada elemento de una colección. Las claves de error usan índices: `"Items[0]"`, `"Items[1]"`, etc.

```csharp
RuleForEach(x => x.Lines)
    .Must(line => line.Quantity > 0)
        .WithMessage("La cantidad debe ser mayor que 0.")
    .Must(line => line.UnitPrice > 0)
        .WithMessage("El precio unitario debe ser mayor que 0.");
```

### RuleForEach con SetValidator

```csharp
RuleForEach(x => x.Lines)
    .SetValidator(new InvoiceLineValidator());
// Errores: Lines[0].ProductId, Lines[1].UnitPrice, etc.
```

---

## Include

`Include` copia todas las reglas de otro validador en el validador actual:

```csharp
public class CreateProductValidator : AbstractValidator<Product>
{
    public CreateProductValidator()
    {
        Include(new ProductBaseValidator());

        // Reglas adicionales específicas de creación
        RuleFor(x => x.Stock).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Category).NotEmpty();
    }
}
```

---

## RuleSwitch — Validación condicional por casos

`RuleSwitch` permite definir grupos de reglas que se activan según el valor de una propiedad discriminadora. Solo se ejecuta **un caso por validación**.

```csharp
public class PaymentValidator : AbstractValidator<PaymentDto>
{
    public PaymentValidator()
    {
        // Regla global: aplica siempre
        RuleFor(x => x.Amount).Positive();

        // Solo se ejecuta el caso que coincide con Method
        RuleSwitch(x => x.Method)
            .Case("credit_card", rules =>
            {
                rules.RuleFor(x => x.CardNumber).NotEmpty();
                rules.RuleFor(x => x.Cvv).NotEmpty().MinimumLength(3).MaximumLength(4);
                rules.RuleFor(x => x.CardHolder).NotEmpty();
            })
            .Case("bank_transfer", rules =>
            {
                rules.RuleFor(x => x.Iban).NotEmpty().Iban();
                rules.RuleFor(x => x.BankName).NotEmpty();
            })
            .Case("paypal", rules =>
            {
                rules.RuleFor(x => x.PaypalEmail).NotEmpty().Email();
            })
            .Default(rules =>
            {
                rules.RuleFor(x => x.Reference).NotEmpty();
            });
    }
}
```

---

## Métodos de validación

### Validate (síncrono)

```csharp
ValidationResult result = validator.Validate(instance);
```

El método síncrono ejecuta únicamente las reglas síncronas. Las reglas definidas con `MustAsync`, `WhenAsync` o `DependentRuleAsync` se omiten.

### ValidateAsync

```csharp
ValidationResult result = await validator.ValidateAsync(instance, cancellationToken);
```

Ejecuta todas las reglas, incluyendo las asíncronas. Es el método recomendado en aplicaciones ASP.NET Core.

### ValidateParallelAsync

```csharp
ValidationResult result = await validator.ValidateParallelAsync(instance, cancellationToken);
```

Ejecuta todas las reglas asíncronas **en paralelo**. Útil cuando hay múltiples `MustAsync` con llamadas independientes a la base de datos.

```csharp
// Uso: ValidateParallelAsync ejecuta las tres queries simultáneamente
var result = await validator.ValidateParallelAsync(order, ct);
```

> **Advertencia:** No uses `ValidateParallelAsync` si las reglas tienen efectos secundarios o dependencias entre sí.

### ValidateAndThrowAsync

```csharp
await validator.ValidateAndThrowAsync(instance, cancellationToken);
```

Equivalente a `ValidateAsync` + comprobación de `IsValid` + lanzamiento de `ValidationException`.

---

## IValidator\<T\> — Interfaz para DI

Siempre inyecta `IValidator<T>` en lugar de la implementación concreta:

```csharp
// Correcto: depende de la interfaz
public class UserController : ControllerBase
{
    private readonly IValidator<CreateUserRequest> _validator;

    public UserController(IValidator<CreateUserRequest> validator)
    {
        _validator = validator;
    }
}
```

---

## CascadeMode global

```csharp
public class StrictValidator : AbstractValidator<PaymentRequest>
{
    protected override CascadeMode GlobalCascadeMode => CascadeMode.StopOnFirstFailure;

    public StrictValidator()
    {
        RuleFor(x => x.CardNumber).NotEmpty().CreditCard();
        RuleFor(x => x.ExpiryMonth).GreaterThan(0).LessThanOrEqualTo(12);
        // Si CardNumber falla, ExpiryMonth no se evalúa
    }
}
```

---

## Siguientes pasos

- **[Reglas básicas](basic-rules)** — Catálogo de todas las reglas disponibles
- **[Reglas avanzadas](advanced-rules)** — Must, MustAsync, Custom, Transform, SetValidator, SwitchOn
- **[CascadeMode](cascade-mode)** — Control del flujo de validación
