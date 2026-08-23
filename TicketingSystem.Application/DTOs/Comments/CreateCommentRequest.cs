using System.ComponentModel.DataAnnotations;

namespace TicketingSystem.Application.DTOs.Comments;

/// <summary>
/// Represents the information required to add a comment to a ticket.
/// </summary>
public sealed class CreateCommentRequest
{
    /// <summary>
    /// Gets or sets the comment text.
    /// </summary>
    [Required]
    [StringLength(5000)]
    public string Content { get; set; } = string.Empty;
}