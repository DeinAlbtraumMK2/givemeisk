import { claimsCollection } from '../function-utils/db'

const badRes = { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) }

export async function handler (event, context) {
  try {
    const pathSplit = event.path.split('/')
    console.log('giveaways', event, pathSplit)
    if (pathSplit.length !== 3) {
      return badRes
    }
    if (event.httpMethod === 'GET') {
      const giveawayId = pathSplit[2]
      const claims = await claimsCollection.find({ giveawayId }).toArray()

      if (claims.length === 0) {
        return badRes
      }
      for (const claim of claims) {
        claim.itemId = claim._id
        delete claim._id
        delete claim.date
        delete claim.giveawayId
      }
      console.log('claims', claims)

      return {
        statusCode: 200,
        body: JSON.stringify(claims)
      }
    } else if (event.httpMethod === 'POST') {
      const claims = JSON.parse(event.body)

      // Get unique discordIds
      const uniqueDiscordIds = new Set()
      for (const claim of claims) {
        uniqueDiscordIds.add(claim.discordId)
      }
      const givenDiscordIds = [...uniqueDiscordIds]// ["513723436263276544", "123456789"]; // Replace with your array of discordIds
      console.log('givenDiscordIds', givenDiscordIds)
      // Match with any existing eveId and eveName
      const potentialIds = await claimsCollection.aggregate([
        {
          $match: {
            discordId: { $in: givenDiscordIds },
            eveId: { $ne: false }
          }
        },
        {
          $group: {
            _id: '$discordId',
            eveId: { $first: '$eveId' },
            eveName: { $first: '$eveName' }
          }
        }
      ]).toArray()
      console.log('potentialIds', potentialIds)

      for (const claim of claims) {
        claim._id = claim.itemId
        claim.date = new Date()
        delete claim.itemId
        const existingClaim = potentialIds.find(p => p._id === claim.discordId)
        if (existingClaim) {
          claim.eveId = existingClaim.eveId
          claim.eveName = existingClaim.eveName
        }
      }
      console.log('claims', claims)
      const insertRes = await claimsCollection.insertMany(claims)
      console.log('insertRes', insertRes)
      return {
        statusCode: 200,
        body: JSON.stringify({})
      }
    }
    return { statusCode: 200, body: JSON.stringify({ error: 'Not implemented' }) }
  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error'
      })
    }
  }
}
// TODO - Admin functions to get all giveaways, delete all /giveaways/abc123 etc, periodic cleaning
