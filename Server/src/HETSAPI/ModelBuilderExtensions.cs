/*
 * REST API Documentation for the MOTI Hired Equipment Tracking System (HETS) Application
 *
 * The Hired Equipment Program is for owners/operators who have a dump truck, bulldozer, backhoe or  other piece of equipment they want to hire out to the transportation ministry for day labour and  emergency projects.  The Hired Equipment Program distributes available work to local equipment owners. The program is  based on seniority and is designed to deliver work to registered users fairly and efficiently  through the development of local area call-out lists. 
 *
 * OpenAPI spec version: v1
 * 
 * 
 */


using System;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace HETSAPI.Models
{

    /// <summary>
    /// Utility extension added to entity framework
    /// </summary>

    public static class ModelBuilderExtensions
    {
        /// <summary>
        /// The table prefix for this application
        /// </summary>
        public const string TABLE_PREFIX = "HET_"; 

        /// <summary>
        /// Implements the following naming convention:
        /// Camel Case converted to upper case, with underscores between words.
        /// Tables have an application specific prefix.
        /// Primary keys have the table name as a prefix
        /// </summary>
        /// <param name="modelBuilder"></param>
        public static void UpperCaseUnderscoreSingularConvention(this ModelBuilder modelBuilder)
        {            
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                // Skip shadow types
                if (entityType.ClrType == null)
                    continue;

                entityType.Relational().TableName = TABLE_PREFIX + ConvertName(entityType.ClrType.Name);

                // Now convert the column names.
                foreach (var entityProperty in entityType.GetProperties())
                {
                    // Special case for the primary key.
                    // Primary key has a prefix of the table name, excluding the application prefix.
                    if (entityProperty.Name != null && entityProperty.Name.ToLowerInvariant().Equals("id"))
                    {
                        entityProperty.Relational().ColumnName = ConvertName(entityType.ClrType.Name) + "_ID";
                    }
                    else
                    {
                        entityProperty.Relational().ColumnName = ConvertName(entityProperty.Name);
                    }
                    
                }
            }
        }

        /// <summary>
        /// Utility function to perform the text conversion
        /// </summary>
        /// <param name="name"></param>
        /// <returns></returns>
        private static String ConvertName(String name)
        {
            // first add the underscore
            string result = Regex.Replace(name, "([^_A-Z])([A-Z])", "$1_$2");
            // then convert to uppercase.  
            result = result.ToUpperInvariant();
            return result;
        }

    }


}