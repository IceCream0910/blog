import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'method not allowed' });
  }

  const searchParams = req.body;

  const body = {
    "type": "BlocksInAncestor",
    "query": searchParams.query,
    "ancestorId": searchParams.ancestorId,
    "filters": {
      "isDeletedOnly": false,
      "excludeTemplates": false,
      "navigableBlockContentOnly": false,
      "requireEditPermissions": false,
      "includePublicPagesWithoutExplicitAccess": true,
      "ancestors": [],
      "createdBy": [],
      "editedBy": [],
      "lastEditedTime": {},
      "createdTime": {},
      "inTeams": [],
      ...searchParams.filters,
    },
    "sort": {
      "field": "relevance"
    },
    limit: searchParams.limit || 100,
    "source": "quick_find_input_change",
    "searchExperimentOverrides": {},
    "searchSessionId": searchParams.searchSessionId,
    "searchSessionFlowNumber": 1,
    "excludedBlockIds": []
  };

  const results = await fetch("https://www.notion.so/api/v3/search", {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  })
    .then((res) => {
      console.log(body)
      if (res.ok) {
        return res
      }

      const error: any = new Error(res.statusText)
      error.response = res
      return Promise.reject(error)
    })
    .then((res) => res.json())


  res.setHeader('Cache-Control', 'public, s-maxage=60, max-age=60, stale-while-revalidate=60');
  res.status(200).json(results);
};
