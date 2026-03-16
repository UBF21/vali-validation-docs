---
id: cascade-mode
title: CascadeMode
sidebar_position: 8
---

# CascadeMode

`CascadeMode` controla qué ocurre cuando una regla falla: si las reglas restantes siguen evaluándose o se detiene la evaluación. Hay dos niveles de control:

1. **Por propiedad** — usando `.StopOnFirstFailure()` en el builder
2. **Global (validador completo)** — sobreescribiendo `GlobalCascadeMode`

---

## Los dos modos

```csharp
public enum CascadeMode
{
    Continue,          // Por defecto: evalúa todas las reglas aunque algunas fallen
    StopOnFirstFailure // Detiene en el primer fallo por propiedad o por validador
}
```

---

## CascadeMode por propiedad

Cuando usas `.StopOnFirstFailure()` en un builder, la evaluación de esa propiedad se detiene tras el primer fallo. Otras propiedades del validador **siguen evaluándose**.

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
        .WithMessage("El email es obligatorio.")
    .Email()
        .WithMessage("El email no tiene un formato válido.")
    .MustAsync(async (email, ct) =>
        !await _users.EmailExistsAsync(email, ct))
        .WithMessage("Ese email ya está registrado.")
    .StopOnFirstFailure();

// Password SÍ se evalúa normalmente aunque Email falle
RuleFor(x => x.Password)
    .NotEmpty()
    .MinimumLength(8);
```

### Por qué es importante

Sin `StopOnFirstFailure`, si el email es `null`:

```
Email: El email es obligatorio.
Email: El email no tiene un formato válido.
Email: <MustAsync podría lanzar NullReferenceException>
```

Con `StopOnFirstFailure`, si el email es `null`:

```
Email: El email es obligatorio.
```

Solo el primer error. Las reglas siguientes no se ejecutan.

---

## CascadeMode global

El modo global aplica al **validador completo**. Cuando `StopOnFirstFailure` está activado globalmente, si la primera **propiedad** evaluada tiene un error, las propiedades posteriores **no se evalúan**.

### Activar el modo global

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

        // Si CardNumber falla, Amount no se evalúa
    }
}
```

### Diferencia visual entre modos

Dado este request inválido:

```csharp
var request = new PaymentRequest
{
    CardNumber = "",    // Falla
    Amount = -10,       // También falla
    Currency = ""       // También falla
};
```

**Con `CascadeMode.Continue` (por defecto):**

```json
{
  "CardNumber": ["El número de tarjeta es obligatorio."],
  "Amount": ["El importe debe ser positivo."],
  "Currency": ["La moneda es obligatoria."]
}
```

**Con `GlobalCascadeMode = CascadeMode.StopOnFirstFailure`:**

```json
{
  "CardNumber": ["El número de tarjeta es obligatorio."]
}
```

Solo el error de la primera propiedad que falla.

---

## Combinando ambos niveles

```csharp
public class CreateOrderValidator : AbstractValidator<CreateOrderRequest>
{
    // Modo global: evalúa todas las propiedades aunque algunas fallen
    protected override CascadeMode GlobalCascadeMode => CascadeMode.Continue;

    public CreateOrderValidator()
    {
        // Esta propiedad se detiene en el primer fallo (evita llamada DB si está vacía)
        RuleFor(x => x.CustomerId)
            .NotEmpty()
            .MustAsync(async id => await _customers.ExistsAsync(id))
            .StopOnFirstFailure();

        // Esta propiedad también se detiene (evita NRE si Card es null)
        RuleFor(x => x.CardNumber)
            .NotEmpty()
            .CreditCard()
            .StopOnFirstFailure();

        // Esta propiedad evalúa todas sus reglas (modo por defecto)
        RuleFor(x => x.Notes)
            .MaximumLength(500)
            .NoWhitespace();
    }
}
```

---

## Cuándo usar cada modo

### Usa `StopOnFirstFailure` por propiedad cuando:

1. **Las reglas posteriores pueden lanzar excepciones** si las anteriores no pasaron (p.ej. `null` en una regla que espera un string)
2. **Hay reglas async caras** que no deben ejecutarse si ya falló una validación básica
3. **Los mensajes acumulados serían confusos** (p.ej. "es null" y "formato inválido" para el mismo campo)

### Usa `GlobalCascadeMode = StopOnFirstFailure` cuando:

1. **La validación del primer campo es prerequisito** para los demás
2. **El rendimiento es crítico** y quieres minimizar el trabajo de validación
3. **Prefieres feedback incremental** (una propiedad a la vez) en lugar de todos los errores a la vez

### Usa `Continue` (por defecto) cuando:

1. **Quieres mostrar todos los errores a la vez** (mejor UX en formularios)
2. **Las reglas son independientes** y no hay riesgo de excepciones en cascada
3. **Estás en una API** donde el cliente quiere conocer todos los problemas de la petición

---

## Siguientes pasos

- **[Resultado de validación](validation-result)** — Cómo leer y usar ValidationResult
- **[Modificadores](modifiers)** — StopOnFirstFailure y otros modificadores en detalle
