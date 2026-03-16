---
id: introduction
title: Introducción
sidebar_position: 1
---

# Introducción a Vali-Validation

## ¿Qué es Vali-Validation?

Vali-Validation es una biblioteca de validación fluent para .NET, diseñada para ser ligera, expresiva y sin dependencias externas innecesarias. Permite definir reglas de validación de forma declarativa mediante una API fluent, separando la lógica de validación del modelo de dominio y de los controladores.

La biblioteca sigue el mismo patrón conceptual que FluentValidation, pero está construida desde cero con un enfoque en:

- **Cero dependencias externas** en el paquete core (solo `Microsoft.Extensions.DependencyInjection.Abstractions`)
- **Soporte nativo de async/await** sin los problemas de deadlock presentes en otras bibliotecas
- **Integración de primera clase** con el ecosistema Vali (Vali-Mediator)
- **API moderna** aprovechando las características de C# 11 y .NET 7+

## ¿Por qué existe?

FluentValidation es excelente, pero en proyectos que usan Vali-Mediator o que buscan minimizar dependencias transitivas, Vali-Validation ofrece:

1. **Integración nativa con `Result<T>`** — En lugar de lanzar excepciones al usar Vali-Mediator, el behavior devuelve `Result<T>.Fail(...)` directamente, sin try/catch en los handlers.
2. **Sin dependencias de terceros** en el core — No se arrastra NuGet packages que podrían tener conflictos de versión.
3. **ValidateParallelAsync** — Ejecuta reglas asíncronas en paralelo de forma nativa, sin configuración adicional.
4. **API de colecciones rica** — `RuleForEach`, `Unique()`, `AllSatisfy()`, `AnySatisfy()`, `In()`, `NotIn()` incluidos de serie.

## Comparación con FluentValidation

| Característica | Vali-Validation | FluentValidation |
|---|---|---|
| Dependencias externas (core) | Solo DI Abstractions | Ninguna |
| Soporte async nativo | Sí, con CT | Sí, con CT |
| Validación en paralelo | `ValidateParallelAsync` | No nativo |
| Integración Mediator | ValiMediator (Result\<T\>) | MediatR (excepción) |
| `Transform<TNew>()` | Sí | Sí (`Transform`) |
| `Custom()` con contexto | Sí (`CustomContext<T>`) | Sí (`ValidationContext<T>`) |
| `SetValidator` anidado | Sí | Sí |
| `RuleForEach` | Sí | Sí |
| `Include` (herencia) | Sí | Sí |
| `When` / `Unless` async | `WhenAsync` / `UnlessAsync` | No nativo |
| Reglas de password | `HasUppercase`, `HasDigit`, etc. | Extensiones separadas |
| Tarjetas de crédito (Luhn) | `CreditCard()` | Sí |
| Licencia | MIT | Apache 2.0 |
| Targets | net7/8/9 | netstandard2.0+ |

## Ecosistema de paquetes

Vali-Validation está dividido en paquetes separados para que solo instales lo que necesitas:

### `Vali-Validation` (core)

El paquete principal. Contiene:

- `AbstractValidator<T>` — clase base para todos los validadores
- `IValidator<T>` — interfaz para inyección de dependencias
- `IRuleBuilder<T, TProperty>` — interfaz fluent con todas las reglas
- `ValidationResult` — resultado con errores y códigos
- `ValidationException` — excepción tipada
- DI registration (`AddValidationsFromAssembly`)

```xml
<PackageReference Include="Vali-Validation" Version="*" />
```

### `Vali-Validation.MediatR`

Integración con **MediatR**. Registra un `IPipelineBehavior<TRequest, TResponse>` que valida automáticamente el request antes de llegar al handler. Si la validación falla, lanza `ValidationException`.

### `Vali-Validation.ValiMediator`

Integración con **Vali-Mediator**. Similar al anterior, pero cuando `TResponse` es `Result<T>`, devuelve `Result<T>.Fail(errors, ErrorType.Validation)` en lugar de lanzar una excepción.

### `Vali-Validation.AspNetCore`

Integración con **ASP.NET Core**. Incluye middleware, `ValiValidationFilter<T>` para Minimal API, y `ValiValidateAttribute` para controladores MVC.

## Siguientes pasos

- **[Instalación](installation)** — Cómo instalar cada paquete y cuándo usar cada uno
- **[Inicio rápido](quick-start)** — Un ejemplo completo en minutos
- **[Validadores](validators)** — AbstractValidator en profundidad
