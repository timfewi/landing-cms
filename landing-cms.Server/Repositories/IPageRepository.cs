namespace landing_cms.Server.Repositories;

using landing_cms.Server.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

/// <summary>
/// Interface für das Page-Repository
/// </summary>
public interface IPageRepository
{
    Task<PageEntity?> GetByIdAsync(Guid id);
    Task<PageEntity?> GetBySlugAsync(string slug);
    Task<IEnumerable<PageEntity>> GetAllAsync();
    Task<PageEntity> CreateAsync(PageEntity page);
    Task<PageEntity?> UpdateAsync(PageEntity page);
    Task<bool> DeleteAsync(Guid id);
}