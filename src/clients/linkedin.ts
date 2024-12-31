import Arcade from "@arcadeai/arcadejs";

interface LinkedInPost {
  author: string;
  lifecycleState: string;
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: {
        text: string;
      };
      shareMediaCategory: string;
    };
  };
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": string;
  };
}

type LinkedInAuthorizationResult =
  | {
      token: string;
      sub: string;
      authorizationUrl?: undefined;
    }
  | {
      authorizationUrl: string;
      token?: undefined;
      sub?: undefined;
    };

interface CreateLinkedInImagePostRequest {
  text: string;
  imageUrl: string;
  imageDescription?: string;
  imageTitle?: string;
}

interface MediaUploadResponse {
  value: {
    uploadMechanism: {
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest": {
        headers: Record<string, string>;
        uploadUrl: string;
      };
    };
    mediaArtifact: string;
    asset: string;
  };
}

interface RegisterUploadRequest {
  registerUploadRequest: {
    recipes: string[];
    owner: string;
    serviceRelationships: Array<{
      relationshipType: string;
      identifier: string;
    }>;
  };
}

export class LinkedInClient {
  private baseURL = "https://api.linkedin.com/v2";
  private accessToken: string;
  private personUrn: string;

  constructor(accessToken: string, personUrn: string) {
    this.accessToken = accessToken;
    this.personUrn = personUrn;
  }

  private async makeRequest<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Create a text-only post
  async createTextPost(text: string): Promise<Response> {
    const endpoint = `${this.baseURL}/ugcPosts`;

    const postData: LinkedInPost = {
      author: `urn:li:person:${this.personUrn}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: text,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    return this.makeRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  private async registerAndUploadMedia(imageUrl: string): Promise<string> {
    // Step 1: Register the upload
    const registerEndpoint = `${this.baseURL}/assets?action=registerUpload`;
    const registerData: RegisterUploadRequest = {
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:person:${this.personUrn}`,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    };

    const registerResponse = await this.makeRequest<MediaUploadResponse>(
      registerEndpoint,
      {
        method: "POST",
        body: JSON.stringify(registerData),
      },
    );

    // Step 2: Get the image data from the URL
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    // Step 3: Upload the image to LinkedIn
    const uploadUrl =
      registerResponse.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
    }

    return registerResponse.value.asset;
  }

  // Create a post with an image
  async createImagePost({
    text,
    imageUrl,
    imageDescription,
    imageTitle,
  }: CreateLinkedInImagePostRequest): Promise<Response> {
    // First register and upload the media
    const mediaAsset = await this.registerAndUploadMedia(imageUrl);

    const endpoint = `${this.baseURL}/ugcPosts`;

    const postData = {
      author: `urn:li:person:${this.personUrn}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text,
          },
          shareMediaCategory: "IMAGE",
          media: [
            {
              status: "READY",
              description: {
                text: imageDescription ?? "Image description",
              },
              media: mediaAsset,
              title: {
                text: imageTitle ?? "Image title",
              },
            },
          ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    return this.makeRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  static async authorizeUser(
    id: string,
    client: Arcade,
  ): Promise<LinkedInAuthorizationResult> {
    const authRes = await client.auth.authorize({
      user_id: id,
      auth_requirement: {
        provider_id: "linkedin",
        oauth2: {
          // w_organization_social is required for posting on behalf of a company.
          // User must have one of the following roles:
          // "ADMINISTRATOR", "DIRECT_SPONSORED_CONTENT_POSTER", "RECRUITING_POSTER"
          scopes: ["w_member_social", "w_organization_social"],
        },
      },
    });

    console.log("authRes");
    console.dir(authRes, { depth: null });

    if (authRes.status === "completed") {
      if (!authRes.context?.token) {
        throw new Error(
          "Authorization status is completed, but token not found",
        );
      }
      if (!authRes.context.user_info?.sub) {
        throw new Error("Authorization status is completed, but sub not found");
      }

      return {
        token: authRes.context.token,
        sub: authRes.context.user_info.sub as string,
      };
    }

    if (authRes.authorization_url) {
      return { authorizationUrl: authRes.authorization_url };
    }

    throw new Error(
      `Authorization failed for user ID: ${id}\nStatus: '${authRes.status}'`,
    );
  }

  static async fromUserId(linkedInUserId: string): Promise<LinkedInClient> {
    const arcadeClient = new Arcade({ apiKey: process.env.ARCADE_API_KEY });
    const authResponse = await LinkedInClient.authorizeUser(
      linkedInUserId,
      arcadeClient,
    );
    if (authResponse.authorizationUrl) {
      throw new Error(
        `User not authorized. Please visit ${authResponse.authorizationUrl} to authorize the user.`,
      );
    }
    if (!authResponse.token) {
      throw new Error("Authorization token not found");
    }
    return new LinkedInClient(authResponse.token, authResponse.sub);
  }
}
