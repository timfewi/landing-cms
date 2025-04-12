namespace landing_cms.Server.Models;

using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

/// <summary>
/// Repräsentiert einen Abschnitt innerhalb einer Landing Page
/// </summary>
public class SectionEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // z.B. "header", "content", "footer", "gallery"
    public int Order { get; set; }
    public Dictionary<string, object> Configuration { get; set; } = new();
    public List<WidgetEntity> Widgets { get; set; } = new();
}