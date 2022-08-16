import core from '@actions/core';
import github from '@actions/github';
import fetch from 'node-fetch';

const data = {
  "org_data" : {
    "trends" : {
      "success_rate" : 1.00,
      "total_credits_used" : 2.00,
      "throughput" : 3.00,
      "total_duration_secs" : 4.00,
      "total_runs" : 5.00
    },
    "metrics" : {
      "success_rate" : 6.00,
      "total_credits_used" : 7,
      "throughput" : 8.00,
      "total_duration_secs" : 9,
      "total_runs" : 10
    }
  },
  "all_projects" : [ "project_1", "project_2" ],
  "org_project_data" : [ {
    "metrics" : {
      "total_credits_used" : 11,
      "total_duration_secs" : 12,
      "total_runs" : 13,
      "success_rate" : 14.00
    },
    "trends" : {
      "total_credits_used" : 15.00,
      "total_duration_secs" : 16.00,
      "total_runs" : 17.00,
      "success_rate" : 18.00
    },
    "project_name" : "project_1"
  }, {
    "metrics" : {
      "total_credits_used" : 19,
      "total_duration_secs" : 20,
      "total_runs" : 21,
      "success_rate" : 22.00
    },
    "trends" : {
      "total_credits_used" : 23.00,
      "total_duration_secs" : 24.00,
      "total_runs" : 25.00,
      "success_rate" : 26.00
    },
    "project_name" : "project_2"
  } ]
}

const flatten = (object = {}, result = {}, path = '') => {
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === 'object' && value != null) {
      flatten(value, result, `${path}${key}.`);
    } else {
      result[path + key] = value;
    };
  };

  return result;
};

var project_data = data.org_project_data.reduce((acc, { project_name, metrics, trends }) => {
  acc[project_name] = { metrics, trends }
  return acc;
}, {});

var flattened_data = flatten({ 
  circleci: {
    org_data: data.org_data, 
    ...project_data 
  }
});

console.log(flattened_data);