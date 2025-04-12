namespace landing_cms.Server.Controllers;

using landing_cms.Server.Models;
using landing_cms.Server.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class PagesController : ControllerBase
{
    private readonly IPageService _pageService;

    public PagesController(IPageService pageService)
    {
        _pageService = pageService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PageEntity>>> GetAllPages()
    {
        var pages = await _pageService.GetAllPagesAsync();
        return Ok(pages);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PageEntity>> GetPageById(Guid id)
    {
        var page = await _pageService.GetPageByIdAsync(id);
        if (page == null)
        {
            return NotFound();
        }

        return Ok(page);
    }

    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<PageEntity>> GetPageBySlug(string slug)
    {
        var page = await _pageService.GetPageBySlugAsync(slug);
        if (page == null)
        {
            return NotFound();
        }

        return Ok(page);
    }

    [HttpPost]
    public async Task<ActionResult<PageEntity>> CreatePage(PageEntity page)
    {
        var createdPage = await _pageService.CreatePageAsync(page);
        return CreatedAtAction(nameof(GetPageById), new { id = createdPage.Id }, createdPage);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PageEntity>> UpdatePage(Guid id, PageEntity page)
    {
        if (id != page.Id)
        {
            return BadRequest("ID in der URL stimmt nicht mit der ID im Body überein");
        }

        var updatedPage = await _pageService.UpdatePageAsync(page);
        if (updatedPage == null)
        {
            return NotFound();
        }

        return Ok(updatedPage);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeletePage(Guid id)
    {
        var result = await _pageService.DeletePageAsync(id);
        if (!result)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPut("{id:guid}/publish")]
    public async Task<ActionResult<PageEntity>> PublishPage(Guid id)
    {
        var publishedPage = await _pageService.PublishPageAsync(id);
        if (publishedPage == null)
        {
            return NotFound();
        }

        return Ok(publishedPage);
    }

    [HttpPut("{id:guid}/unpublish")]
    public async Task<ActionResult<PageEntity>> UnpublishPage(Guid id)
    {
        var unpublishedPage = await _pageService.UnpublishPageAsync(id);
        if (unpublishedPage == null)
        {
            return NotFound();
        }

        return Ok(unpublishedPage);
    }
}