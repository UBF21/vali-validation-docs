---
id: advanced-patterns
title: Advanced Patterns
sidebar_position: 15
---

# Advanced Patterns

This document covers complex use cases: validator composition, inheritance, advanced conditional validation, passwords and nested collections.

---

## Nested Validators with SetValidator

### Model with Multiple Nesting Levels

```csharp
public class CreateInvoiceRequest
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public CustomerInfo Customer { get; set; } = new();
    public Address BillingAddress { get; set; } = new();
    public Address ShippingAddress { get; set; } = new();
    public List<InvoiceLine> Lines { get; set; } = new();
    public PaymentInfo Payment { get; set; } = new();
}
```

### Validators per Section

```csharp
public class CustomerInfoValidator : AbstractValidator<CustomerInfo>
{
    public CustomerInfoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.TaxId)
            .NotEmpty()
            .Matches(@"^[A-Z0-9]{9}$")
                .WithMessage("The tax ID must have 9 uppercase alphanumeric characters.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .Email();
    }
}

public class AddressValidator : AbstractValidator<Address>
{
    public AddressValidator()
    {
        RuleFor(x => x.Street)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.City)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.PostalCode)
            .NotEmpty()
            .Matches(@"^\d{5}$")
                .WithMessage("The postal code must have 5 digits.");

        RuleFor(x => x.CountryCode)
            .NotEmpty()
            .LengthBetween(2, 3)
            .Uppercase()
                .WithMessage("The country code must be uppercase (e.g.: US, FR, DE).");
    }
}

public class InvoiceLineValidator : AbstractValidator<InvoiceLine>
{
    public InvoiceLineValidator()
    {
        RuleFor(x => x.ProductCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Quantity).GreaterThan(0);
        RuleFor(x => x.UnitPrice).GreaterThan(0m).MaxDecimalPlaces(2);

        RuleFor(x => x.DiscountPercent)
            .ExclusiveBetween(0m, 100m)
                .WithMessage("The discount must be a percentage between 0 and 100 (exclusive).")
            .When(x => x.DiscountPercent.HasValue);
    }
}
```

### Root Validator That Composes Everything

```csharp
public class CreateInvoiceValidator : AbstractValidator<CreateInvoiceRequest>
{
    public CreateInvoiceValidator()
    {
        RuleFor(x => x.InvoiceNumber)
            .NotEmpty()
            .Matches(@"^INV-\d{4}-\d{6}$")
                .WithMessage("The invoice number must have the format INV-YYYY-XXXXXX.");

        RuleFor(x => x.Customer)
            .NotNull()
            .SetValidator(new CustomerInfoValidator());
        // Errors: Customer.Name, Customer.TaxId, Customer.Email

        RuleFor(x => x.BillingAddress)
            .NotNull()
            .SetValidator(new AddressValidator());
        // Errors: BillingAddress.Street, BillingAddress.City, etc.

        RuleFor(x => x.ShippingAddress)
            .SetValidator(new AddressValidator())
            .When(x => x.ShippingAddress != null);

        RuleFor(x => x.Lines)
            .NotEmptyCollection()
                .WithMessage("The invoice must have at least one line.");

        RuleForEach(x => x.Lines)
            .SetValidator(new InvoiceLineValidator());
        // Errors: Lines[0].ProductCode, Lines[1].UnitPrice, etc.

        RuleFor(x => x.Payment)
            .NotNull()
            .SetValidator(new PaymentInfoValidator());
    }
}
```

---

## Include for Validator Inheritance

`Include` allows building validators in layers, where each layer adds rules without knowing the rules of the others.

### Case: Domain Entities with Common Fields

```csharp
// Base validator for common fields shared by create and update
public class ProductBaseValidator : AbstractValidator<CreateProductRequest>
{
    public ProductBaseValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(200);

        RuleFor(x => x.Price)
            .GreaterThan(0m)
            .MaxDecimalPlaces(2);
    }
}

// Specific creation validator
public class CreateProductValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductValidator()
    {
        Include(new ProductBaseValidator());
        // Only the ProductBaseValidator rules, nothing else
    }
}

// Admin update validator — extends the base rules
public class AdminUpdateProductValidator : AbstractValidator<AdminUpdateProductRequest>
{
    public AdminUpdateProductValidator()
    {
        // Includes base rules from CreateProductRequest
        Include(new ProductBaseValidator());

        // Adds update-specific rules
        RuleFor(x => x.Id)
            .GreaterThan(0)
                .WithMessage("The product ID must be valid.");

        RuleFor(x => x.ModifiedBy)
            .NotEmpty()
                .WithMessage("The name of the modifying admin is required.");

        RuleFor(x => x.ModificationReason)
            .NotEmpty()
                .WithMessage("A reason for the modification is required.")
            .MinimumLength(20)
                .WithMessage("The reason must have at least 20 characters.")
            .MaximumLength(500);
    }
}
```

---

## Complex Conditional Validation

### Pattern: Entity Type Determines Required Fields

```csharp
public class CreateCustomerValidator : AbstractValidator<CreateCustomerRequest>
{
    public CreateCustomerValidator()
    {
        // Type is always required
        RuleFor(x => x.CustomerType)
            .NotEmpty()
            .In(new[] { "individual", "company" })
                .WithMessage("The customer type must be 'individual' or 'company'.")
            .StopOnFirstFailure();

        // Common fields
        RuleFor(x => x.Email).NotEmpty().Email();
        RuleFor(x => x.Phone).NotEmpty().PhoneNumber();

        // Individual fields — only if individual
        RuleFor(x => x.FirstName)
            .NotEmpty()
                .WithMessage("The first name is required for individual customers.")
            .MaximumLength(100)
            .When(x => x.CustomerType == "individual");

        RuleFor(x => x.BirthDate)
            .NotNull()
                .WithMessage("The birth date is required for individual customers.")
            .PastDate()
            .Must(d => d.HasValue && DateTime.Today.Year - d.Value.Year >= 18)
                .WithMessage("The customer must be of legal age.")
            .When(x => x.CustomerType == "individual");

        // Company fields — only if company
        RuleFor(x => x.CompanyName)
            .NotEmpty()
                .WithMessage("The company name is required for companies.")
            .MaximumLength(300)
            .When(x => x.CustomerType == "company");

        RuleFor(x => x.TaxId)
            .NotEmpty()
                .WithMessage("The tax ID is required for companies.")
            .Matches(@"^[A-Z][0-9]{7}[A-Z0-9]$")
                .WithMessage("The tax ID does not have a valid format.")
            .When(x => x.CustomerType == "company");
    }
}
```

---

## Advanced Password Validation

```csharp
public class PasswordPolicyValidator : AbstractValidator<SetPasswordRequest>
{
    private static readonly string[] CommonPasswords = new[]
    {
        "password", "12345678", "qwerty123", "admin1234", "letmein!"
    };

    public PasswordPolicyValidator()
    {
        RuleFor(x => x.NewPassword)
            // Basic structure
            .NotEmpty()
                .WithMessage("The password is required.")
            .MinimumLength(12)
                .WithMessage("The password must have at least 12 characters.")
            .MaximumLength(128)
                .WithMessage("The password cannot exceed 128 characters.")
            // Complexity
            .HasUppercase()
                .WithMessage("Must contain at least one uppercase letter.")
            .HasLowercase()
                .WithMessage("Must contain at least one lowercase letter.")
            .HasDigit()
                .WithMessage("Must contain at least one number.")
            .HasSpecialChar()
                .WithMessage("Must contain at least one special character (! @ # $ % ...).")
            // Prohibited passwords
            .Must(pwd => !CommonPasswords.Any(common =>
                pwd.Contains(common, StringComparison.OrdinalIgnoreCase)))
                .WithMessage("The password contains a sequence that is too common.")
                .WithErrorCode("PASSWORD_TOO_COMMON")
            // No spaces
            .NoWhitespace()
                .WithMessage("The password cannot contain spaces.")
            .StopOnFirstFailure();

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty()
            .EqualToProperty(x => x.NewPassword)
                .WithMessage("The passwords do not match.")
            .StopOnFirstFailure();
    }
}
```

---

## Complex Nested Collections

```csharp
public class ProductNodeValidator : AbstractValidator<ProductNode>
{
    public ProductNodeValidator()
    {
        RuleFor(x => x.Sku)
            .NotEmpty()
            .Matches(@"^[A-Z0-9-]{3,20}$")
                .WithMessage("The SKU must have between 3 and 20 alphanumeric characters or hyphens.");

        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThan(0m).MaxDecimalPlaces(2);

        RuleFor(x => x.Images)
            .MaxCount(10)
                .WithMessage("A product can have at most 10 images.");

        RuleForEach(x => x.Images)
            .NotEmpty()
            .Url()
                .WithMessage("Each image must be a valid URL.");
    }
}

public class CategoryNodeValidator : AbstractValidator<CategoryNode>
{
    public CategoryNodeValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .Matches(@"^[A-Z0-9_]{2,20}$")
                .WithMessage("The category code must be uppercase alphanumeric.");

        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);

        // Validates each product within the category
        RuleForEach(x => x.Products)
            .SetValidator(new ProductNodeValidator());

        RuleFor(x => x.Subcategories)
            .MaxCount(20)
                .WithMessage("A category can have at most 20 subcategories.");

        RuleForEach(x => x.Subcategories)
            .Must(sub => sub.Subcategories.Count == 0)
                .WithMessage("Subcategories cannot have nested subcategories.")
            .SetValidator(new CategoryNodeValidator());
    }
}
```

---

## Combining New Rules in Real Scenarios

### Booking Form: Date Ranges and Guest Counts

```csharp
public class CreateBookingValidator : AbstractValidator<CreateBookingRequest>
{
    public CreateBookingValidator()
    {
        RuleFor(x => x.CheckInDate)
            .FutureDate()
                .WithMessage("The check-in date must be in the future.")
            .IsWeekday()
                .WithMessage("Check-in is only available Monday–Friday.")
            .WithinNext(TimeSpan.FromDays(180))
                .WithMessage("Bookings can only be made up to 6 months in advance.");

        RuleFor(x => x.CheckOutDate)
            .GreaterThanProperty(x => x.CheckInDate)
                .WithMessage("The check-out date must be after the check-in date.")
            .DateBetween(DateTime.Today, DateTime.Today.AddDays(365))
                .WithMessage("The check-out date must be within the next year.");

        RuleFor(x => x.Guests)
            .Positive()
                .WithMessage("There must be at least one guest.");

        RuleFor(x => x.SpecialRequests)
            .MaximumLength(500)
            .NoHtmlTags()
                .WithMessage("Special requests cannot contain HTML.")
            .When(x => x.SpecialRequests != null);
    }
}
```

### User Registration: Age, Password Policy, and Country

```csharp
public class RegisterUserValidator : AbstractValidator<RegisterUserRequest>
{
    public RegisterUserValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .MinWords(2)
                .WithMessage("Please enter your first and last name.")
            .MaximumLength(200)
            .NoHtmlTags();

        RuleFor(x => x.Email)
            .NotEmpty()
            .Email()
            .MaximumLength(320);

        RuleFor(x => x.BirthDate)
            .PastDate()
                .WithMessage("The birth date must be in the past.")
            .MinAge(18)
                .WithMessage("You must be at least 18 years old to register.")
            .MaxAge(120)
                .WithMessage("Please enter a realistic birth date.");

        // All-in-one password policy: 10+ chars, upper, lower, digit, special
        RuleFor(x => x.Password)
            .NotEmpty()
            .PasswordPolicy(minLength: 10, requireSpecialChar: true)
                .WithMessage("The password does not meet the security policy.")
            .StopOnFirstFailure();

        RuleFor(x => x.ConfirmPassword)
            .EqualToProperty(x => x.Password)
                .WithMessage("The passwords do not match.");

        RuleFor(x => x.CountryCode)
            .NotEmpty()
            .CountryCode()
                .WithMessage("Please select a valid country (ISO 3166-1 alpha-2 code).");
    }
}
```

### Financial Form: Precision, Percentage, and IBAN

```csharp
public class CreatePaymentValidator : AbstractValidator<CreatePaymentRequest>
{
    public CreatePaymentValidator()
    {
        RuleFor(x => x.Amount)
            .Positive()
                .WithMessage("The payment amount must be greater than 0.")
            .Precision(18, 2)
                .WithMessage("The amount cannot have more than 2 decimal places.");

        RuleFor(x => x.Currency)
            .NotEmpty()
            .CurrencyCode()
                .WithMessage("The currency must be a valid ISO 4217 code (e.g. USD, EUR, GBP).");

        RuleFor(x => x.BeneficiaryIban)
            .NotEmpty()
                .WithMessage("The beneficiary IBAN is required.")
            .Iban()
                .WithMessage("The beneficiary IBAN is not valid.");

        RuleFor(x => x.ServiceFeePercent)
            .NonNegative()
                .WithMessage("The service fee cannot be negative.")
            .Percentage()
                .WithMessage("The service fee must be between 0% and 100%.")
            .Precision(5, 2)
                .WithMessage("The service fee cannot have more than 2 decimal places.");

        RuleFor(x => x.Metadata)
            .IsValidJson()
                .WithMessage("The metadata field must contain valid JSON.")
            .When(x => x.Metadata != null);
    }
}
```

---

## Rule Reuse with Extension Methods

You can create extensions for `IRuleBuilder` that encapsulate rules common to multiple validators:

```csharp
public static class ValiValidationExtensions
{
    public static IRuleBuilder<T, string> IsValidNationalId<T>(
        this IRuleBuilder<T, string> builder)
    {
        return builder
            .NotEmpty()
            .Matches(@"^\d{9}$")
                .WithMessage("The identification document does not have a valid format.");
    }

    public static IRuleBuilder<T, decimal> IsValidPrice<T>(
        this IRuleBuilder<T, decimal> builder,
        decimal maxPrice = 999999.99m)
    {
        return builder
            .GreaterThan(0m)
                .WithMessage("The price must be greater than 0.")
            .LessThanOrEqualTo(maxPrice)
                .WithMessage($"The price cannot exceed {maxPrice:C}.")
            .MaxDecimalPlaces(2)
                .WithMessage("The price cannot have more than 2 decimal places.");
    }
}

// Usage in validators
public class BankAccountValidator : AbstractValidator<BankAccount>
{
    public BankAccountValidator()
    {
        RuleFor(x => x.HolderNationalId).IsValidNationalId();
        RuleFor(x => x.Iban).IsValidIban();
    }
}
```

---

## Switch/Case: Polymorphic Validation

When your object has a **type discriminator** field, `RuleSwitch` and `SwitchOn` give you a clean, exhaustive way to express that branching logic.

### Shipping Form with Multiple Delivery Types

```csharp
public class ShipmentValidator : AbstractValidator<ShipmentRequest>
{
    public ShipmentValidator()
    {
        RuleFor(x => x.TrackingNumber)
            .NotEmpty()
            .Matches(@"^TRK-\d{10}$")
                .WithMessage("The tracking number must have the format TRK-XXXXXXXXXX.");

        RuleFor(x => x.ShippingType)
            .NotEmpty()
            .In(new[] { "home_delivery", "store_pickup", "locker" })
                .WithMessage("The shipping type must be home_delivery, store_pickup or locker.")
            .StopOnFirstFailure();

        RuleSwitch(x => x.ShippingType)
            .Case("home_delivery", rules =>
            {
                rules.RuleFor(x => x.RecipientName).NotEmpty().MaximumLength(200);
                rules.RuleFor(x => x.Street).NotEmpty().MaximumLength(200);
                rules.RuleFor(x => x.City).NotEmpty().MaximumLength(100);
                rules.RuleFor(x => x.PostalCode)
                    .NotEmpty()
                    .Matches(@"^\d{5}$")
                        .WithMessage("The postal code must be exactly 5 digits.");
            })
            .Case("store_pickup", rules =>
            {
                rules.RuleFor(x => x.StoreCode)
                    .NotEmpty()
                    .Matches(@"^STR-[A-Z0-9]{4}$")
                        .WithMessage("The store code must have the format STR-XXXX.");
            })
            .Case("locker", rules =>
            {
                rules.RuleFor(x => x.LockerId)
                    .NotEmpty()
                    .Matches(@"^LKR-\d{6}$")
                        .WithMessage("The locker ID must have the format LKR-XXXXXX.");
                rules.RuleFor(x => x.LockerAccessCode)
                    .NotEmpty()
                    .IsNumeric()
                    .LengthBetween(4, 8)
                        .WithMessage("The access code must be 4–8 digits.");
            });
    }
}
```

---

## Next Steps

- **[CascadeMode](cascade-mode)** — Fine-grained control of validation flow in complex cases
- **[Advanced Rules](advanced-rules)** — Custom and Transform for special cases
- **[Vali-Mediator Integration](valimediator-integration)** — Pipeline behavior with Result\<T\>
