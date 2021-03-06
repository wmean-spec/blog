import express from 'express'
import asyncHandler from 'express-async-handler'

import * as crud from '../app/crud.mjs'
import renderPost from '../renders/post.mjs'
import requireField from '../middleware/fields.mjs'
import editorOnly from '../middleware/editor.mjs'
import authorOnly from '../middleware/author.mjs'

import * as images from '../app/images.mjs'

const router = express.Router()

/**
 *  @openapi
 *  components:
 *    schemas:
 *      Post:
 *        type: object
 *        properties:
 *          id:
 *            type: integer
 *          title:
 *            type: string
 *          photos:
 *            type: array
 *            items:
 *              type: string
 *          createdAt:
 *            type: string
 *            format: date
 *          author:
 *            $ref: '#/components/schemas/User'
 *          tag:
 *            $ref: '#/components/schemas/TagHierarchy'
 *          content:
 *            type: string
 *      NewPost:
 *        type: object
 *        properties:
 *          title:
 *            required: true
 *            type: string
 *          photos:
 *            type: array
 *            items:
 *              type: string
 *          tagId:
 *            required: true
 *            type: integer
 *          content:
 *            required: true
 *            type: string
 *    parameters:
 *      postId:
 *        name: postId
 *        in: path
 *        required: true
 *        schema:
 *          type: integer
 */

/**
 *  @openapi
 *  /posts:
 *    get:
 *      description: Get list of all posts
 *      parameters:
 *        - in: query
 *          name: createdAt
 *          schema:
 *            type: string
 *            format: date
 *        - in: query
 *          name: createdUntil
 *          schema:
 *            type: string
 *            format: date
 *        - in: query
 *          name: createdSince
 *          schema:
 *            type: string
 *            format: date
 *        - in: query
 *          name: author
 *          schema:
 *            type: string
 *        - in: query
 *          name: tagId
 *          schema:
 *            type: integer
 *        - in: query
 *          name: search
 *          description: Substring to be found
 *          schema:
 *            type: string
 *        - in: query
 *          name: searchIn
 *          description: >
 *            A set of fields where we are looking, listed separated by commas.
 *            Possible values: post, author, tag.
 *            Default: post
 *          schema:
 *            type: string
 *        - $ref: '#/components/parameters/limit'
 *        - $ref: '#/components/parameters/offset'
 *      responses:
 *        200:
 *          description: Returns list of posts
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Post'
 *        500:
 *          $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  asyncHandler(async function (req, res) {
    const { limit, offset } = req.query
    const posts = await crud.getAllPosts(req.query, limit, offset)
    res.send(posts.map(post => renderPost(post, false)))
  })
)

/**
 *  @openapi
 *  /posts:
 *    post:
 *      description: Create post. Editor only.
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/NewPost'
 *      responses:
 *        200:
 *          description: Returns created post
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  user:
 *                    $ref: '#/components/schemas/Post'
 *                  password:
 *                    type: string
 *        500:
 *          $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  editorOnly,
  requireField('title', 'tagId', 'content'),
  asyncHandler(async function (req, res) {
    const postData = req.body
    postData.photos = postData.photos?.map(images.saveImage)
    const post = await crud.createPost(req.auth.User, postData)
    res.send(renderPost(await crud.getPostById(post.id), true))
  })
)

/**
 *  @openapi
 *  /posts/{postId}:
 *    get:
 *      description: Get post info
 *      parameters:
 *        - $ref: '#/components/parameters/postId'
 *      responses:
 *        200:
 *          description: Return post by id
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: '#/components/schemas/Post'
 *        403:
 *          description: You must be author of this post
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *        404:
 *          description: There is no post with this ID
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Error'
 *        500:
 *          $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:postId',
  authorOnly,
  asyncHandler(async function (req, res) {
    const { postId } = req.params
    const post = await crud.getPostById(postId)
    if (post) {
      res.send(renderPost(post, true))
    } else {
      res.status(404).send({ msg: 'Post not found' })
    }
  })
)

/**
 *  @openapi
 *  /posts/{postId}:
 *    put:
 *      description: Update posts data. Author only.
 *      parameters:
 *        - $ref: '#/components/parameters/postId'
 *      requestBody:
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Post'
 *      responses:
 *        200:
 *          description: Success
 *        500:
 *          $ref: '#/components/responses/ServerError'
 */
router.put(
  '/:postId',
  authorOnly,
  asyncHandler(async function (req, res) {
    const { postId } = req.params
    await crud.updatePost(postId, req.body)
    res.send()
  })
)

export default router
