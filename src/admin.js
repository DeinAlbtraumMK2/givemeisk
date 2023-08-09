let data
let grid

const displayInvalid = () => {
  document.querySelector('.content').innerHTML =
      `<div class="d-flex justify-content-center align-items-center min-vh-100">
          <h3 class="text-center">Invalid link, please ask in discord</h3>
      </div>`
}
const displayError = () => {
  document.querySelector('.content').innerHTML =
      `<div class="d-flex justify-content-center align-items-center min-vh-100">
          <h3 class="text-center">Something went wrong, please ask in discord</h3>
      </div>`
}
const displayClaims = (giveawayId, claims) => {
  let html = ''
  html += `
    <div class="container">
        <div class="row my-3">
            <div class="col">
                <h3>Giveaway: ${giveawayId}</h3>
                <div class="table-holder"></div>
            </div>
        </div>
    </div>`
  document.querySelector('.content').innerHTML = html

  data = claims.map((c, i) => [i, c.prize, c.discordName, c.eveName, c.contractSent ? 'YES' : 'NO', null, c.itemId])
  console.log('data', data)
  grid = new window.gridjs.Grid({
    columns: [
      { name: 'Index', hidden: true },
      {
        name: 'Prize',
        sort: true,
        formatter: (cell, row) => {
          return window.gridjs.html(`<a href="/claims/?id=${row.cells[6].data}" target="_blank">${row.cells[1].data}</a>`)
        }
      },
      { name: 'Discord', sort: true },
      { name: 'EVE', sort: true },
      { name: 'Contract Sent', sort: true },
      {
        name: 'Actions',
        formatter: (cell, row) => {
          const cssClass = row.cells[4].data ? 'btn-outline-primary' : 'btn-primary'
          const actionName = row.cells[4].data ? 'Mark as NOT SENT' : 'Mark as SENT'
          return window.gridjs.h('button', {
            className: `btn ${cssClass} w-100`,
            onClick: () => {
              // This is hacky...
              data[row.cells[0].data][4] = data[row.cells[0].data][4] === 'YES' ? 'NO' : 'YES'
              console.log('row', row, cell, row.cells[4].data, data[row.cells[0].data])
              grid.updateConfig().forceRender()
              updateClaimWithContract(data[row.cells[0].data][6], data[row.cells[0].data][4] === 'YES')
            }
          }, actionName)
        }

      },
      { name: 'ItemID', hidden: true }],
    data,
    fixedHeader: true,
    search: true

  }).render(document.querySelector('.table-holder'))
}
const updateClaimWithContract = async (claimId, contractSent) => {
  console.log('updateClaimWithContract', claimId, contractSent)
  const updateReq = await fetch(`/claims/${claimId}`, { method: 'POST', body: JSON.stringify({ contractSent }) })
  const updateRes = await updateReq.json()
  console.log('updateRes', updateRes)
}
const init = async () => {
  console.log('admin')
  try {
    const queryParams = new URLSearchParams(window.location.search)
    if (!queryParams.has('id')) {
      return displayInvalid()
    }
    const giveawayId = queryParams.get('id')
    const claimsReq = await fetch(`/giveaways/${giveawayId}`)
    const claimsRes = await claimsReq.json()
    console.log('claimsRes', claimsRes)
    displayClaims(giveawayId, claimsRes)
  } catch (error) {
    console.error(error)
    return displayError()
  }
}
init()
