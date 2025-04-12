namespace landing_cms.Server.Services;

using landing_cms.Server.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

/// <summary>
/// Interface für den Page-Service
/// </summary>
public interface IPageService
{
    Task<PageEntity?> GetPageByIdAsync(Guid id);
    Task<PageEntity?> GetPageBySlugAsync(string slug);
    Task<IEnumerable<PageEntity>> GetAllPagesAsync();
    Task<PageEntity> CreatePageAsync(PageEntity page);
    Task<PageEntity?> UpdatePageAsync(PageEntity page);
    Task<bool> DeletePageAsync(Guid id);
    Task<PageEntity?> PublishPageAsync(Guid id);
    Task<PageEntity?> UnpublishPageAsync(Guid id);
}