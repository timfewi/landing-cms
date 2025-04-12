namespace landing_cms.Server.Models;

using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

/// <summary>
/// Repräsentiert eine Landing Page im CMS
/// </summary>
public class PageEntity
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public List<SectionEntity> Sections { get; set; } = new();
    public Dictionary<string, string> Metadata { get; set; } = new();
}