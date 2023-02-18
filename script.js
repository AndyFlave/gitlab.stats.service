const gitlabAPI = 'https://gitlab.rshbcloud.ru/api/v4';

let projectID
let accessToken
let fromDate
let toDate

const perPage = 100
const branch = 'master'

$form = document.querySelector('.navigation')

$form.addEventListener('submit', event => {
  event.preventDefault()

  const formData = new FormData($form)
  const formValues = Object.fromEntries(formData.entries())

  projectID = formValues['id-repo']
  accessToken = formValues['token']
  fromDate = formValues['start-date']
  toDate = formValues['end-date']

  start()
})


function defineAutor(name) {
  if (name === 'alex' || name === 'Ткаченко Александр' || name === 'francuz2009') {
    return 'Ткаченко Александр'
  }

  if (name === 'Andy' || name === 'Andrey Shushunov' || name === 'Андрей Шушунов') {
    return 'Андрей Шушунов'
  }

  if (name === 'dmitry' || name === 'Косых Дмитрий Викторович') {
    return 'Косых Дмитрий Викторович'
  }

  return name
}

async function getCodeStats(projectID, accessToken, fromDate, toDate, perPage) {
  const commitsUrl = `${gitlabAPI}/projects/${projectID}/repository/commits?&since=${fromDate}&until=${toDate}&per_page=${perPage}`

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
  }

  let codeStats = {}
  let page = 1
  let morePages = true
  let commitsIDS = []

  while (morePages) {
    const commitsResponse = await fetch(`${commitsUrl}&page=${page}`, { headers })
    const commits = await commitsResponse.json()

    if (commits.length === 0) {
      morePages = false
    } else {

      for (const commit of commits) {

        if (commitsIDS.includes(commit.id)) {
          continue
        } else {
          commitsIDS.push(commit.id)
        }

        const commitDetailsResponse = await fetch(`${gitlabAPI}/projects/${projectID}/repository/commits/${commit.id}`, { headers })
        const commitDetails = await commitDetailsResponse.json()
        const author = defineAutor(commitDetails.author_name)
        const additions = commitDetails.stats.additions
        const deletions = commitDetails.stats.deletions

        if (!codeStats[author]) {
          codeStats[author] = { commits: 0, additions: 0, deletions: 0 }
        }

        codeStats[author].additions += additions
        codeStats[author].deletions += deletions
        codeStats[author].commits++
      }
      page++
    }
  }


  return codeStats
}

let codeStatsResult

async function start() {
  const $rootTable = document.querySelector('table')
  const $loader = document.querySelector('.loader')
  const $message = document.querySelector('.message')

  document.querySelectorAll('.table tr:not(.table__head)').forEach(el => {
    if (el) el.remove()
  })

  $message.style.display = 'none'

  $loader.classList.add('loader_active')

  codeStatsResult = await getCodeStats(projectID, accessToken, fromDate, toDate, perPage)

  $loader.classList.remove('loader_active')

  if (!Object.keys(codeStatsResult).length) {
    $message.style.display = 'block'
  }

  Object.entries(codeStatsResult).forEach(el => {
    let cellData = [el[0], ...Object.values(el[1])]
    let tableRow = document.createElement('tr')
    $rootTable.append(tableRow)

    cellData.forEach(cell => {
      let tableCell = document.createElement('td')
      tableRow.append(tableCell)
      tableCell.innerText = cell
    })
  })
}