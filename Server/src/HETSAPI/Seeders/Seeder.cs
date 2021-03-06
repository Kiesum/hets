﻿using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace HETSAPI.Seeders
{
    public abstract class Seeder<T> where T : DbContext
    {
        public const string AllProfiles = "all";

        private readonly IHostingEnvironment _env;
        protected ILogger _logger;

        protected Seeder(IConfiguration configuration, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            _env = env;
            _logger = loggerFactory.CreateLogger(typeof(Seeder<T>));
            Configuration = configuration;
        }

        protected bool IsEnvironment(string environmentName)
        {
            return _env.IsEnvironment(environmentName);
        }

        protected bool IsDevelopmentEnvironment { get { return _env.IsDevelopment(); } }

        protected bool IsTestEnvironment { get { return _env.IsEnvironment("Test"); } }

        protected bool IsStagingEnvironment { get { return _env.IsStaging(); } }

        protected bool IsProductionEnvironment { get { return _env.IsProduction(); } }

        protected IConfiguration Configuration { get; private set; }

        public virtual Type InvokeAfter { get { return null; } }

        protected abstract IEnumerable<string> TriggerProfiles { get; }

        protected abstract void Invoke(T context);

        public void Seed(T context)
        {
            if (TriggerProfiles.Contains(_env.EnvironmentName, StringComparer.OrdinalIgnoreCase) || TriggerProfiles.Contains(AllProfiles, StringComparer.OrdinalIgnoreCase))
            {
                _logger.LogDebug("The trigger for {0} ({1}) matches the deployment profile ({2}); executing...", GetType().Name, string.Join(", ", TriggerProfiles), AllProfiles);
                Invoke(context);
            }
            else
            {
                _logger.LogDebug("Trigger profile(s) for {0} ({1}), do not match the deployment profile ({2}); skipping...", GetType().Name, string.Join(", ", TriggerProfiles), _env.EnvironmentName);
            }
        }
    }
}
