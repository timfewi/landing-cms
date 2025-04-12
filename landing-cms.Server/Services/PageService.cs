namespace landing_cms.Server.Services;

using landing_cms.Server.Models;
using landing_cms.Server.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

/// <summary>
/// Implementierung des Page-Services
/// </summary>
public class PageService : IPageService
{
    private readonly IPageRepository _pageRepository;

    public PageService(IPageRepository pageRepository)
    {
        _pageRepository = pageRepository;
    }

    public async Task<PageEntity?> GetPageByIdAsync(Guid id)
    {
        return await _pageRepository.GetByIdAsync(id);
    }

    public async Task<PageEntity?> GetPageBySlugAsync(string slug)
    {
        return await _pageRepository.GetBySlugAsync(slug);
    }

    public async Task<IEnumerable<PageEntity>> GetAllPagesAsync()
    {
        return await _pageRepository.GetAllAsync();
    }

    public async Task<PageEntity> CreatePageAsync(PageEntity page)
    {
        page.CreatedAt = DateTime.UtcNow;
        return await _pageRepository.CreateAsync(page);
    }

    public async Task<PageEntity?> UpdatePageAsync(PageEntity page)
    {
        var existingPage = await _pageRepository.GetByIdAsync(page.Id);
        if (existingPage == null)
        {
            return null;
        }

        page.UpdatedAt = DateTime.UtcNow;
        page.CreatedAt = existingPage.CreatedAt;
        page.PublishedAt = existingPage.PublishedAt;
        page.IsPublished = existingPage.IsPublished;

        return await _pageRepository.UpdateAsync(page);
    }

    public async Task<bool> DeletePageAsync(Guid id)
    {
        return await _pageRepository.DeleteAsync(id);
    }

    public async Task<PageEntity?> PublishPageAsync(Guid id)
    {
        var page = await _pageRepository.GetByIdAsync(id);
        if (page == null)
        {
            return null;
        }

        page.IsPublished = true;
        page.PublishedAt = DateTime.UtcNow;
        page.UpdatedAt = DateTime.UtcNow;

        return await _pageRepository.UpdateAsync(page);
    }

    public async Task<PageEntity?> UnpublishPageAsync(Guid id)
    {
        var page = await _pageRepository.GetByIdAsync(id);
        if (page == null)
        {
            return null;
        }

        page.IsPublished = false;
        page.UpdatedAt = DateTime.UtcNow;

        return await _pageRepository.UpdateAsync(page);
    }
}