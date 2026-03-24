import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { config } from '../config'
import type { AuthUser, Channel, Message } from '../lib/types'
import { setCredentials } from './authSlice'

type RootStateWithAuth = { auth: { accessToken: string | null } }

interface LoginResponse {
  access_token: string
  user: { id: string; email: string; name: string }
}

function toAuthUser(u: LoginResponse['user']): AuthUser {
  return { sub: u.id, email: u.email, name: u.name, groups: [] }
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: config.apiUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootStateWithAuth).auth.accessToken
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ['Channel', 'Messages', 'Members'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            setCredentials({
              accessToken: data.access_token,
              user: toAuthUser(data.user),
            })
          )
        } catch {
          /* unwrap throws */
        }
      },
    }),

    register: builder.mutation<
      LoginResponse,
      { email: string; password: string; name: string }
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(
            setCredentials({
              accessToken: data.access_token,
              user: toAuthUser(data.user),
            })
          )
        } catch {
          /* unwrap throws */
        }
      },
    }),

    listChannels: builder.query<{ items: Channel[]; count: number }, void>({
      query: () => '/api/chat/channels',
      providesTags: ['Channel'],
    }),

    createChannel: builder.mutation<
      {
        channel_id: string
        name: string
        type: string
        member_count: number
        created_at: string
      },
      { name: string; type: string; member_ids: string[]; description?: string }
    >({
      query: (body) => ({
        url: '/api/chat/channels',
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      }),
      invalidatesTags: ['Channel'],
    }),

    listMessages: builder.query<
      { items: Message[]; count: number; read_cursor: Record<string, string> },
      string
    >({
      query: (channelId) => `/api/chat/channels/${channelId}/messages`,
      providesTags: (_result, _err, channelId) => [
        { type: 'Messages', id: channelId },
      ],
    }),

    addMembers: builder.mutation<
      { added: { user_id: string; type: string }[]; channel_id: string },
      { channelId: string; memberIds: string[] }
    >({
      query: ({ channelId, memberIds }) => ({
        url: `/api/chat/channels/${channelId}/members`,
        method: 'POST',
        body: { member_ids: memberIds },
        headers: { 'Content-Type': 'application/json' },
      }),
      invalidatesTags: (_r, _e, { channelId }) => [
        'Channel',
        { type: 'Members', id: channelId },
      ],
    }),

    removeMember: builder.mutation<
      { removed: string; channel_id: string },
      { channelId: string; userId?: string }
    >({
      query: ({ channelId, userId }) => ({
        url: `/api/chat/channels/${channelId}/members`,
        method: 'DELETE',
        body: userId ? { user_id: userId } : {},
        headers: { 'Content-Type': 'application/json' },
      }),
      invalidatesTags: (_r, _e, { channelId }) => [
        'Channel',
        { type: 'Members', id: channelId },
      ],
    }),

    listMembers: builder.query<
      {
        items: {
          user_id: string
          member_type: string
          role: string
          joined_at: string
        }[]
        count: number
        channel_id: string
      },
      string
    >({
      query: (channelId) => `/api/chat/channels/${channelId}/members`,
      providesTags: (_result, _err, channelId) => [
        { type: 'Members', id: channelId },
      ],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useListChannelsQuery,
  useLazyListChannelsQuery,
  useListMessagesQuery,
  useLazyListMessagesQuery,
  useCreateChannelMutation,
  useAddMembersMutation,
  useRemoveMemberMutation,
  useListMembersQuery,
} = api
