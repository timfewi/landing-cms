namespace landing_cms.Server.Models;

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

/// <summary>
/// Repräsentiert ein Widget innerhalb einer Sektion einer Landing Page
/// </summary>
public class WidgetEntity
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty; // z.B. "text", "image", "video", "button", "form"
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public JsonDocument Content { get; set; } = JsonDocument.Parse("{}");
    public Dictionary<string, string> Styles { get; set; } = new();
    public Dictionary<string, object> Configuration { get; set; } = new();
}