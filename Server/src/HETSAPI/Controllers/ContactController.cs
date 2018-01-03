using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.SwaggerGen.Annotations;
using HETSAPI.Models;
using HETSAPI.Services;
using HETSAPI.Authorization;

namespace HETSAPI.Controllers
{
    /// <summary>
    /// Contact Controller
    /// </summary>
    public class ContactController : Controller
    {
        private readonly IContactService _service;

        /// <summary>
        /// Create a controller and set the service
        /// </summary>
        public ContactController(IContactService service)
        {
            _service = service;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="items"></param>
        /// <response code="201">Contact created</response>
        [HttpPost]
        [Route("/api/contacts/bulk")]
        [SwaggerOperation("ContactsBulkPost")]
        [RequiresPermission(Permission.ADMIN)]
        public virtual IActionResult ContactsBulkPost([FromBody]Contact[] items)
        {
            return this._service.ContactsBulkPostAsync(items);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <response code="200">OK</response>
        [HttpGet]
        [Route("/api/contacts")]
        [SwaggerOperation("ContactsGet")]
        [SwaggerResponse(200, type: typeof(List<Contact>))]
        public virtual IActionResult ContactsGet()
        {
            return this._service.ContactsGetAsync();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id">id of Contact to delete</param>
        /// <response code="200">OK</response>
        /// <response code="404">Contact not found</response>
        [HttpPost]
        [Route("/api/contacts/{id}/delete")]
        [SwaggerOperation("ContactsIdDeletePost")]
        public virtual IActionResult ContactsIdDeletePost([FromRoute]int id)
        {
            return this._service.ContactsIdDeletePostAsync(id);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id">id of Contact to fetch</param>
        /// <response code="200">OK</response>
        /// <response code="404">Contact not found</response>
        [HttpGet]
        [Route("/api/contacts/{id}")]
        [SwaggerOperation("ContactsIdGet")]
        [SwaggerResponse(200, type: typeof(Contact))]
        public virtual IActionResult ContactsIdGet([FromRoute]int id)
        {
            return this._service.ContactsIdGetAsync(id);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id">id of Contact to fetch</param>
        /// <param name="item"></param>
        /// <response code="200">OK</response>
        /// <response code="404">Contact not found</response>
        [HttpPut]
        [Route("/api/contacts/{id}")]
        [SwaggerOperation("ContactsIdPut")]
        [SwaggerResponse(200, type: typeof(Contact))]
        public virtual IActionResult ContactsIdPut([FromRoute]int id, [FromBody]Contact item)
        {
            return this._service.ContactsIdPutAsync(id, item);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="item"></param>
        /// <response code="201">Contact created</response>
        [HttpPost]
        [Route("/api/contacts")]
        [SwaggerOperation("ContactsPost")]
        [SwaggerResponse(200, type: typeof(Contact))]
        public virtual IActionResult ContactsPost([FromBody]Contact item)
        {
            return this._service.ContactsPostAsync(item);
        }
    }
}
