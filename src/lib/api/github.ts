/*
 * Copyright 2012-2017 Online-Go.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface HttpsApiGithubComReposOnlineGoOnlineGoComContributors_GET_Request {
}
export interface HttpsApiGithubComReposOnlineGoOnlineGoComContributors_GET {
    request: HttpsApiGithubComReposOnlineGoOnlineGoComContributors_GET_Request;
    response: HttpsApiGithubComReposOnlineGoOnlineGoComContributors_GET_Response;
}
export type HttpsApiGithubComReposOnlineGoOnlineGoComContributors_GET_Response = Array<{
    login: string;
    id: number;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    contributions: number;
}>;
