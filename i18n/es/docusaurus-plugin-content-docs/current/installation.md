---
id: installation
title: Instalación
sidebar_position: 2
---

# Instalación

## Requisitos previos

- .NET SDK 7.0, 8.0 o 9.0
- Cualquier IDE compatible: Visual Studio 2022+, Rider, VS Code con C# DevKit

## Paquetes disponibles

| Paquete | Descripción | Cuándo instalarlo |
|---|---|---|
| `Vali-Validation` | Core de validación | Siempre |
| `Vali-Validation.MediatR` | Integración con MediatR | Si usas MediatR |
| `Vali-Validation.ValiMediator` | Integración con Vali-Mediator | Si usas Vali-Mediator |
| `Vali-Validation.AspNetCore` | Middleware y filtros ASP.NET Core | Si usas ASP.NET Core |

---

## Paquete core: `Vali-Validation`

```bash
dotnet add package Vali-Validation
```

El paquete core tiene **una sola dependencia transitiva**: `Microsoft.Extensions.DependencyInjection.Abstractions`.

---

## Integración con MediatR: `Vali-Validation.MediatR`

```bash
dotnet add package Vali-Validation.MediatR
```

### Estructura típica con MediatR

```
MyApp.sln
├── MyApp.Api/                    ← Instala Vali-Validation.MediatR + MediatR
├── MyApp.Application/            ← Instala Vali-Validation
└── MyApp.Domain/                 ← Sin dependencias de validación
```

---

## Integración con Vali-Mediator: `Vali-Validation.ValiMediator`

```bash
dotnet add package Vali-Validation.ValiMediator
```

> **Importante:** No instales `Vali-Validation.MediatR` y `Vali-Validation.ValiMediator` en el mismo proyecto. Son mutuamente excluyentes.

---

## Integración con ASP.NET Core: `Vali-Validation.AspNetCore`

```bash
dotnet add package Vali-Validation.AspNetCore
```

### Combinaciones habituales

**API Minimal + Vali-Mediator + AspNetCore:**

```xml
<ItemGroup>
  <PackageReference Include="Vali-Validation.ValiMediator" Version="1.0.0" />
  <PackageReference Include="Vali-Validation.AspNetCore" Version="1.0.0" />
</ItemGroup>
```

**API MVC + MediatR + AspNetCore:**

```xml
<ItemGroup>
  <PackageReference Include="Vali-Validation.MediatR" Version="1.0.0" />
  <PackageReference Include="Vali-Validation.AspNetCore" Version="1.0.0" />
</ItemGroup>
```

---

## Verificación de la instalación

```bash
dotnet build
```

---

## Siguiente paso

Con los paquetes instalados, sigue con el **[Inicio rápido](quick-start)** para ver un ejemplo completo funcionando en minutos.
