require('dotenv').config();

const core = require('@actions/core');
const fetch = require('node-fetch');

class HTTPResponseError extends Error {
	constructor(response, ...args) {
    super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
		this.response = response;
	}
}

const flatten = ({ object = {}, result = {}, path = '' }) => {
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'object' && value != null) {
      flatten({ object: value, result, path: `${path}${key}.` });
    } else {
      result[path + key] = value;
    };
  };
  
  return result;
};

(async () => {
  try {
    const {
      CIRCLE_CI_INSIGHTS_SUMMARY_API_KEY,
      CIRCLE_CI_INSIGHTS_SUMMARY_PROJECT_SLUG,
      CIRCLE_CI_INSIGHTS_SUMMARY_REPORTING_WINDOW,
      CIRCLE_CI_INSIGHTS_SUMMARY_DEBUG,
    } = process.env;
  
    const apiKey = core.getInput('api-key') || CIRCLE_CI_INSIGHTS_SUMMARY_API_KEY;
    const projectSlug = core.getInput('project-slug') || CIRCLE_CI_INSIGHTS_SUMMARY_PROJECT_SLUG;
    const reportingWindow = core.getInput('reporting-window') || CIRCLE_CI_INSIGHTS_SUMMARY_REPORTING_WINDOW || 'last-24-hours';

    if (!apiKey || !projectSlug || !reportingWindow) {
      throw new Error('Missing one or more required parameters');
    }
  
    const url = `https://circleci.com/api/v2/insights/${projectSlug}/summary?reporting-window=${reportingWindow}`;
    let data;
  
    try {
      console.log('fetching data', url);
  
      const response = await fetch(url, {
        headers: {
          'Circle-Token': apiKey,
        },
      });
  
      if (!response.ok) {
        throw new HTTPResponseError(response);
      }
  
      data = await response.json();
    } catch (error) {
      if (CIRCLE_CI_INSIGHTS_SUMMARY_DEBUG) {
        console.error(error); // avoid leaking the API key when logging the request object
      }
  
      const body = await error.response.text();
      throw new Error(`Failed to fetch summary from Circle CI: ${error.message}: ${body}`);
    }
  
    console.log('raw data', JSON.stringify(data, null, 2));  
  
    const projectData = data.org_project_data.reduce((acc, { project_name, metrics, trends }) => {
      acc[project_name] = { metrics, trends }
      return acc;
    }, {});
    
    const flattenedData = flatten({ object: { 
      circleci: {
        org_data: data.org_data, 
        ...projectData 
      }
    }});
  
    console.log('flattened data', flattenedData);

    for (const [key, value] of Object.entries(flattenedData)) {
      core.setOutput(key, value);
    }

    core.setOutput('circleci.summary.json', JSON.stringify(flattenedData));
    
    console.log('✨ Done!');
  } catch (error) {
    console.error(error);
    core.setFailed(`Failed to fetch or process Circle CI data: ${error.message}`);
    throw error;
  }
})();