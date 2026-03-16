---
id: advanced-patterns
title: Patrones avanzados
sidebar_position: 15
---

# Patrones avanzados

Este documento cubre casos de uso complejos: composición de validadores, herencia, validación condicional avanzada, contraseñas y colecciones anidadas.

---

## Validadores anidados con SetValidator

```csharp
public class CreateInvoiceValidator : AbstractValidator<CreateInvoiceRequest>
{
    public CreateInvoiceValidator()
    {
        RuleFor(x => x.InvoiceNumber)
            .NotEmpty()
            .Matches(@"^INV-\d{4}-\d{6}$")
                .WithMessage("El número de factura debe tener el formato INV-AAAA-XXXXXX.");

        RuleFor(x => x.Customer)
            .NotNull()
            .SetValidator(new CustomerInfoValidator());
        // Errores: Customer.Name, Customer.TaxId, Customer.Email

        RuleFor(x => x.BillingAddress)
            .NotNull()
            .SetValidator(new AddressValidator());

        RuleFor(x => x.Lines)
            .NotEmptyCollection()
                .WithMessage("La factura debe tener al menos una línea.");

        RuleForEach(x => x.Lines)
            .SetValidator(new InvoiceLineValidator());
        // Errores: Lines[0].ProductCode, Lines[1].UnitPrice, etc.
    }
}
```

---

## Include para herencia de validadores

`Include` permite construir validadores en capas, donde cada capa añade reglas sin conocer las reglas de las demás.

```csharp
// Validador base con campos comunes a creación y actualización
public class ProductBaseValidator : AbstractValidator<CreateProductRequest>
{
    public ProductBaseValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MinimumLength(3).MaximumLength(200);
        RuleFor(x => x.Price).GreaterThan(0m).MaxDecimalPlaces(2);
    }
}

// Validador de actualización admin — extiende las reglas base
public class AdminUpdateProductValidator : AbstractValidator<AdminUpdateProductRequest>
{
    public AdminUpdateProductValidator()
    {
        Include(new ProductBaseValidator());

        RuleFor(x => x.Id).GreaterThan(0)
            .WithMessage("El ID del producto debe ser válido.");

        RuleFor(x => x.ModifiedBy).NotEmpty()
            .WithMessage("El nombre del admin que modifica es obligatorio.");

        RuleFor(x => x.ModificationReason)
            .NotEmpty()
            .MinimumLength(20)
            .MaximumLength(500);
    }
}
```

---

## Validación condicional compleja

### Patrón: el tipo de entidad determina los campos obligatorios

```csharp
public class CreateCustomerValidator : AbstractValidator<CreateCustomerRequest>
{
    public CreateCustomerValidator()
    {
        RuleFor(x => x.CustomerType)
            .NotEmpty()
            .In(new[] { "individual", "company" })
                .WithMessage("El tipo de cliente debe ser 'individual' o 'company'.")
            .StopOnFirstFailure();

        // Campos comunes
        RuleFor(x => x.Email).NotEmpty().Email();
        RuleFor(x => x.Phone).NotEmpty().PhoneNumber();

        // Campos de persona física — solo si es individual
        RuleFor(x => x.FirstName)
            .NotEmpty()
                .WithMessage("El nombre es obligatorio para clientes individuales.")
            .MaximumLength(100)
            .When(x => x.CustomerType == "individual");

        RuleFor(x => x.BirthDate)
            .NotNull()
            .PastDate()
            .Must(d => d.HasValue && DateTime.Today.Year - d.Value.Year >= 18)
                .WithMessage("El cliente debe ser mayor de edad.")
            .When(x => x.CustomerType == "individual");

        // Campos de empresa — solo si es company
        RuleFor(x => x.CompanyName)
            .NotEmpty()
                .WithMessage("El nombre de la empresa es obligatorio.")
            .MaximumLength(300)
            .When(x => x.CustomerType == "company");

        RuleFor(x => x.TaxId)
            .NotEmpty()
                .WithMessage("El CIF/NIF es obligatorio para empresas.")
            .When(x => x.CustomerType == "company");
    }
}
```

---

## Validación avanzada de contraseñas

```csharp
public class PasswordPolicyValidator : AbstractValidator<SetPasswordRequest>
{
    public PasswordPolicyValidator()
    {
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("La contraseña es obligatoria.")
            .MinimumLength(12).WithMessage("La contraseña debe tener al menos 12 caracteres.")
            .MaximumLength(128)
            .HasUppercase().WithMessage("Debe contener al menos una mayúscula.")
            .HasLowercase().WithMessage("Debe contener al menos una minúscula.")
            .HasDigit().WithMessage("Debe contener al menos un número.")
            .HasSpecialChar().WithMessage("Debe contener al menos un carácter especial.")
            .NoWhitespace().WithMessage("La contraseña no puede contener espacios.")
            .StopOnFirstFailure();

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty()
            .EqualToProperty(x => x.NewPassword)
                .WithMessage("Las contraseñas no coinciden.")
            .StopOnFirstFailure();
    }
}
```

---

## Reutilización de reglas con métodos de extensión

```csharp
public static class ValiValidationExtensions
{
    public static IRuleBuilder<T, string> IsValidNationalId<T>(
        this IRuleBuilder<T, string> builder)
    {
        return builder
            .NotEmpty()
            .Matches(@"^\d{9}$")
                .WithMessage("El documento de identidad no tiene un formato válido.");
    }

    public static IRuleBuilder<T, decimal> IsValidPrice<T>(
        this IRuleBuilder<T, decimal> builder,
        decimal maxPrice = 999999.99m)
    {
        return builder
            .GreaterThan(0m).WithMessage("El precio debe ser mayor que 0.")
            .LessThanOrEqualTo(maxPrice).WithMessage($"El precio no puede superar {maxPrice:C}.")
            .MaxDecimalPlaces(2).WithMessage("El precio no puede tener más de 2 decimales.");
    }
}

// Uso en validadores
public class BankAccountValidator : AbstractValidator<BankAccount>
{
    public BankAccountValidator()
    {
        RuleFor(x => x.HolderNationalId).IsValidNationalId();
        RuleFor(x => x.Price).IsValidPrice(maxPrice: 50000m);
    }
}
```

---

## Switch/Case: Validación polimórfica

```csharp
public class ShipmentValidator : AbstractValidator<ShipmentRequest>
{
    public ShipmentValidator()
    {
        RuleFor(x => x.TrackingNumber)
            .NotEmpty()
            .Matches(@"^TRK-\d{10}$")
                .WithMessage("El número de seguimiento debe tener el formato TRK-XXXXXXXXXX.");

        RuleFor(x => x.ShippingType)
            .NotEmpty()
            .In(new[] { "home_delivery", "store_pickup", "locker" })
            .StopOnFirstFailure();

        RuleSwitch(x => x.ShippingType)
            .Case("home_delivery", rules =>
            {
                rules.RuleFor(x => x.RecipientName).NotEmpty().MaximumLength(200);
                rules.RuleFor(x => x.Street).NotEmpty().MaximumLength(200);
                rules.RuleFor(x => x.PostalCode).NotEmpty().Matches(@"^\d{5}$");
            })
            .Case("store_pickup", rules =>
            {
                rules.RuleFor(x => x.StoreCode).NotEmpty().Matches(@"^STR-[A-Z0-9]{4}$");
            })
            .Case("locker", rules =>
            {
                rules.RuleFor(x => x.LockerId).NotEmpty().Matches(@"^LKR-\d{6}$");
                rules.RuleFor(x => x.LockerAccessCode).NotEmpty().IsNumeric().LengthBetween(4, 8);
            });
    }
}
```

---

## Siguientes pasos

- **[CascadeMode](cascade-mode)** — Control detallado del flujo de validación en casos complejos
- **[Reglas avanzadas](advanced-rules)** — Custom y Transform para casos especiales
- **[Integración con Vali-Mediator](valimediator-integration)** — Pipeline behavior con Result\<T\>
