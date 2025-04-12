namespace landing_cms.Server.Repositories;

using landing_cms.Server.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

/// <summary>
/// In-Memory Implementierung des Page-Repositories
/// </summary>
public class InMemoryPageRepository : IPageRepository
{
    private readonly ConcurrentDictionary<Guid, PageEntity> _pages = new();

    public Task<PageEntity?> GetByIdAsync(Guid id)
    {
        _pages.TryGetValue(id, out var page);
        return Task.FromResult(page);
    }

    public Task<PageEntity?> GetBySlugAsync(string slug)
    {
        var page = _pages.Values.FirstOrDefault(p => p.Slug.Equals(slug, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(page);
    }

    public Task<IEnumerable<PageEntity>> GetAllAsync()
    {
        return Task.FromResult<IEnumerable<PageEntity>>(_pages.Values.ToList());
    }

    public Task<PageEntity> CreateAsync(PageEntity page)
    {
        if (page.Id == Guid.Empty)
        {
            page.Id = Guid.NewGuid();
        }

        _pages[page.Id] = page;
        return Task.FromResult(page);
    }

    public async Task<PageEntity?> UpdateAsync(PageEntity page)
    {
        var existingPage = await GetByIdAsync(page.Id);
        if (existingPage == null)
        {
            return null;
        }

        _pages[page.Id] = page;
        return page;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existingPage = await GetByIdAsync(id);
        if (existingPage == null)
        {
            return false;
        }

        return _pages.TryRemove(id, out _);
    }
}