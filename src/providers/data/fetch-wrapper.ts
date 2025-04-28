import { GraphQLFormattedError } from "graphql";

type Error = {
  message: string;
  statusCode: string;
};

const customFetch = async (url: string, options: RequestInit) => {
  const accessToken = localStorage.getItem("access_token");
  const headers = options.headers as Record<string, string>;

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: headers?.Authorization || `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
  });
};

const getGrapghQLErrors = (
  body: Record<"errors", GraphQLFormattedError[] | undefined>
): Error | null => {
  if (!body.errors) {
    return {
      message: "An unexpected error occurred",
      statusCode: "Internal Server Error",
    };
  }

  if ("errors" in body && body.errors.length > 0) {
    const errorMessages = body?.errors.map((error) => error.message).join(", ");
    const code = body?.errors[0]?.extensions?.code;
    return {
      message: errorMessages || JSON.stringify(body.errors),
      statusCode: code || 500,
    };
  }

  return null;
};

export const fetchWrapper = async (url: string, options: RequestInit) => {
  const response = await customFetch(url, options);
  const responseClone = response.clone();
  const body = await responseClone.json();

  const error = getGrapghQLErrors(body);
  if (error) {
    throw new Error(error.message);
  }
  return response;
}
