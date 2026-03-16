---
id: switch-case
title: Switch / Case
sidebar_position: 16
---

# Switch / Case — Validación condicional avanzada

Este documento describe dos funcionalidades complementarias para la validación condicional en Vali-Validation: **`RuleSwitch`** y **`SwitchOn`**. Ambas permiten aplicar diferentes conjuntos de reglas dependiendo de un valor en tiempo de ejecución, pero operan a diferentes niveles de granularidad.

---

## Resumen

| Funcionalidad | Nivel | Pregunta clave |
|---|---|---|
| `RuleSwitch` | Validador (múltiples propiedades) | "¿Qué grupo de reglas debo ejecutar para el objeto completo?" |
| `SwitchOn` | Propiedad (propiedad única) | "¿Qué reglas aplican a *este campo específico* según otro campo?" |

Ambas funcionalidades comparten la misma semántica:

- **Exclusividad**: solo se ejecuta un caso por ejecución de validación.
- **Fallback Default**: un branch `.Default(...)` opcional se ejecuta cuando ningún caso coincide.
- **Sin coincidencia, sin Default**: si no hay coincidencia y no hay Default, el bloque switch no produce errores.
- **Las reglas globales no se ven afectadas**: las reglas definidas fuera del switch siempre se ejecutan.

---

## Comparación rápida

| | `RuleSwitch` | `SwitchOn` |
|---|---|---|
| Dónde se llama | Dentro del constructor de `AbstractValidator<T>` | Encadenado en una llamada `RuleFor(...)` |
| Discriminador | Cualquier propiedad del objeto raíz | Cualquier propiedad del objeto raíz |
| Alcance de cada caso | Múltiples propiedades, conjuntos de reglas completos | Una sola propiedad |
| Tipo de cuerpo del caso | `Action<AbstractValidator<T>>` | `Action<IRuleBuilder<T, TProperty>>` |

---

## Parte 1: RuleSwitch

### ¿Qué es RuleSwitch?

`RuleSwitch` es un bloque switch/case a nivel de validador. Se define dentro del constructor de una clase que hereda `AbstractValidator<T>`. Lee un valor discriminador del objeto que se está validando y aplica las reglas del caso coincidente — reglas que pueden abarcar múltiples propiedades.

```csharp
protected ICaseBuilder<T, TKey> RuleSwitch<TKey>(Expression<Func<T, TKey>> keyExpression)
```

### Ejemplo 1 — Método de pago (discriminador string)

```csharp
public class PaymentValidator : AbstractValidator<PaymentDto>
{
    public PaymentValidator()
    {
        // Reglas globales — siempre se ejecutan independientemente del Method
        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("El campo Amount debe ser mayor que cero.");

        RuleFor(x => x.Method)
            .NotEmpty()
            .WithMessage("El campo Method es obligatorio.");

        // Switch: exactamente un caso se ejecuta basado en x.Method
        RuleSwitch(x => x.Method)
            .Case("credit_card", rules =>
            {
                rules.RuleFor(x => x.CardNumber)
                    .NotEmpty()
                        .WithMessage("El número de tarjeta es obligatorio para pagos con tarjeta.")
                    .CreditCard()
                        .WithMessage("El número de tarjeta debe ser un número de tarjeta de crédito válido.");

                rules.RuleFor(x => x.Cvv)
                    .NotEmpty()
                        .WithMessage("El CVV es obligatorio.")
                    .MinimumLength(3)
                    .MaximumLength(4);

                rules.RuleFor(x => x.ExpirationDate)
                    .NotNull()
                        .WithMessage("La fecha de expiración es obligatoria.")
                    .FutureDate()
                        .WithMessage("La fecha de expiración debe estar en el futuro.");
            })
            .Case("bank_transfer", rules =>
            {
                rules.RuleFor(x => x.Iban)
                    .NotEmpty()
                        .WithMessage("El IBAN es obligatorio para transferencias bancarias.")
                    .Iban()
                        .WithMessage("El IBAN debe ser un IBAN válido.");

                rules.RuleFor(x => x.BankCode)
                    .NotEmpty()
                        .WithMessage("El código bancario es obligatorio.");
            })
            .Case("paypal", rules =>
            {
                rules.RuleFor(x => x.PaypalEmail)
                    .NotEmpty()
                        .WithMessage("El email de PayPal es obligatorio para pagos con PayPal.")
                    .Email()
                        .WithMessage("El email de PayPal debe ser una dirección de email válida.");
            })
            .Default(rules =>
            {
                rules.RuleFor(x => x.Reference)
                    .NotEmpty()
                        .WithMessage("La referencia es obligatoria para este método de pago.");
            });
    }
}
```

### Ejemplo 2 — Tipo de usuario (discriminador enum)

```csharp
public enum UserType { Admin, Client, Guest }

public class CreateUserValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(50).IsAlphanumeric();
        RuleFor(x => x.Email).NotEmpty().Email();

        RuleSwitch(x => x.Type)
            .Case(UserType.Admin, rules =>
            {
                rules.RuleFor(x => x.AdminAccessCode)
                    .NotEmpty().WithMessage("Los admins deben proporcionar un código de acceso.")
                    .MinimumLength(16).WithMessage("El código de acceso debe tener al menos 16 caracteres.");

                rules.RuleFor(x => x.Permissions)
                    .NotEmptyCollection().WithMessage("Los admins deben tener al menos un permiso asignado.");
            })
            .Case(UserType.Client, rules =>
            {
                rules.RuleFor(x => x.CompanyName)
                    .NotEmpty().WithMessage("El nombre de empresa es obligatorio para cuentas de cliente.");

                rules.RuleFor(x => x.TaxId)
                    .NotEmpty().WithMessage("El CIF/NIF es obligatorio para cuentas de cliente.");
            })
            .Case(UserType.Guest, rules =>
            {
                rules.RuleFor(x => x.SessionToken)
                    .NotEmpty().WithMessage("Se requiere un token de sesión para acceso de invitado.")
                    .Guid().WithMessage("El token de sesión debe ser un GUID válido.");
            });
    }
}
```

---

## Parte 2: SwitchOn

### ¿Qué es SwitchOn?

`SwitchOn` es un switch a **nivel de propiedad**. Se encadena directamente en una llamada `RuleFor(...)` y determina qué reglas aplicar a esa propiedad única basándose en el valor de otra propiedad.

### Ejemplo: Validación de número de documento

```csharp
public class DocumentValidator : AbstractValidator<DocumentDto>
{
    public DocumentValidator()
    {
        RuleFor(x => x.DocumentNumber)
            .SwitchOn(x => x.DocumentType)
            .Case("passport", b => b
                .NotEmpty()
                .Matches(@"^[A-Z]{2}\d{6}$")
                    .WithMessage("El pasaporte debe tener el formato AA999999."))
            .Case("dni", b => b
                .NotEmpty()
                .IsNumeric()
                .MinimumLength(8)
                .MaximumLength(8)
                    .WithMessage("El DNI debe tener exactamente 8 dígitos."))
            .Case("ruc", b => b
                .NotEmpty()
                .IsNumeric()
                .MinimumLength(11)
                .MaximumLength(11)
                    .WithMessage("El RUC debe tener exactamente 11 dígitos."))
            .Default(b => b.NotEmpty());
    }
}
```

---

## Combinando RuleSwitch con reglas globales

Las reglas declaradas antes de `RuleSwitch` siempre se ejecutan independientemente del caso que coincida.

```csharp
public class PaymentValidator : AbstractValidator<PaymentDto>
{
    public PaymentValidator()
    {
        // Reglas globales: siempre evaluadas
        RuleFor(x => x.Amount).Positive();
        RuleFor(x => x.Currency).NotEmpty().CurrencyCode();

        // Reglas variantes: solo se evalúa el caso coincidente
        RuleSwitch(x => x.Method)
            .Case("credit_card", rules =>
            {
                rules.RuleFor(x => x.CardNumber).NotEmpty().CreditCard();
                rules.RuleFor(x => x.Cvv).NotEmpty().MinimumLength(3).MaximumLength(4);
            })
            .Case("bank_transfer", rules =>
            {
                rules.RuleFor(x => x.Iban).NotEmpty().Iban();
            })
            .Case("paypal", rules =>
            {
                rules.RuleFor(x => x.PaypalEmail).NotEmpty().Email();
            });
    }
}
```

---

## Siguientes pasos

- **[Patrones avanzados](advanced-patterns)** — Composición y herencia
- **[Modificadores](modifiers)** — When/Unless y otros modificadores por regla
- **[Reglas avanzadas](advanced-rules)** — Must, MustAsync, Custom, Transform
