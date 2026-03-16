---
id: index
title: Overview
sidebar_position: 0
---

# Vali-Validation

Lightweight fluent validation library for **.NET 7, 8, and 9** — zero external dependencies.

## Architecture Overview

```mermaid
graph TD
    A[AbstractValidator&lt;T&gt;] -->|exposes| B[RuleFor / RuleForEach]
    B --> C[IRuleBuilder&lt;T, TProp&gt;]
    C -->|adds rules| D[RuleBuilder&lt;T, TProp&gt;]
    D -->|produces| E[ValidationResult]
    E -->|Errors| F["Dictionary&lt;string, List&lt;string&gt;&gt;"]
    E -->|ErrorCodes| G["Dictionary&lt;string, List&lt;string&gt;&gt;"]
```

## Package Ecosystem

```mermaid
graph LR
    Core["Vali-Validation (core)"]
    AspNet["Vali-Validation.AspNetCore"]
    MediatR["Vali-Validation.MediatR"]
    ValiM["Vali-Validation.ValiMediator"]

    Core --> AspNet
    Core --> MediatR
    Core --> ValiM
```

| Package | Purpose |
|---|---|
| `Vali-Validation` | Core library: validators, rules, ValidationResult, ValidationException |
| `Vali-Validation.AspNetCore` | Middleware, endpoint filters, action filters |
| `Vali-Validation.MediatR` | IPipelineBehavior for MediatR (throws ValidationException) |
| `Vali-Validation.ValiMediator` | IPipelineBehavior for Vali-Mediator (returns Result&lt;T&gt;.Fail) |

## Validation Flow

```mermaid
flowchart TD
    A[Incoming Request] --> B{ValidateAsync}
    B -->|IsValid| C[Continue to Handler]
    B -->|!IsValid| D{Integration type?}
    D -->|Vali-Mediator Result&lt;T&gt;| E["Return Result&lt;T&gt;.Fail"]
    D -->|MediatR / Service| F[Throw ValidationException]
    F --> G[Middleware → HTTP 400]
```

## Quick Example

```csharp
public class CreateProductValidator : AbstractValidator<CreateProductRequest>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MinimumLength(3);

        RuleFor(x => x.Price)
            .GreaterThan(0m).WithMessage("Price must be positive.");
    }
}

// DI registration
builder.Services.AddValidationsFromAssembly(typeof(Program).Assembly);

// Usage
var result = await validator.ValidateAsync(request);
if (!result.IsValid)
    return Results.ValidationProblem(result.Errors.ToDictionary(k => k.Key, v => v.Value.ToArray()));
```

## Get Started

- [Introduction](introduction) — What is Vali-Validation and how it compares
- [Installation](installation) — NuGet packages and project setup
- [Quick Start](quick-start) — A complete working example in minutes
