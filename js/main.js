import { getWeatherData, getWeatherByCoords, getFlagUrl } from "./api.js";
import { uiElement, updateThemeIcon, renderWeatherData, renderCityList, setLoader, renderRecentChips, updateUnitToggle, renderError, clearError } from "./ui.js";


const THEME = "theme"
const RECENT = "recent"
const UNITS = "units"

const body = document.body


//projede global tutulan degiskenler
const STATE = {
    theme: localStorage.getItem(THEME) || 'dark',
    recent: JSON.parse(localStorage.getItem(RECENT) || "[]"),
    units: localStorage.getItem(UNITS) || 'metric'
}




document.addEventListener('DOMContentLoaded', () => {
    handleGeoSearch()
    renderCityList()

    body.setAttribute("data-theme", STATE.theme)
    updateThemeIcon(STATE.theme)

    renderRecentChips(STATE.recent, (city) => {
        uiElement.searchInput.value = city
        handleSearch(city)
    })

    updateUnitToggle(STATE.units)

})

//kullanici konumuna gore ara
const handleGeoSearch = () => {

    window.navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords
            

            //loader goster
            setLoader(true)

            const data = await getWeatherByCoords(latitude, longitude, STATE.units)

            //loader kaldir
            setLoader(false)

            const flagUrl = getFlagUrl(data.sys.country)

            renderWeatherData(data, flagUrl, STATE.units)

            pushRecent(data.name)

        }, () => {
            //hata ver
            renderError("konum yuklenirken hata oldu")
        }
    )
}


//theme butonu tiklanirsa
uiElement.themeBtn.addEventListener("click", () => {
    STATE.theme = STATE.theme === "light" ? "dark" : "light"

    body.setAttribute("data-theme", STATE.theme)

    persist()
    updateThemeIcon(STATE.theme)

})

//degisiklikleri local e kaydet
const persist = () => {
    localStorage.setItem(THEME, STATE.theme)
    localStorage.setItem(RECENT, JSON.stringify(STATE.recent))
    localStorage.setItem(UNITS, STATE.units)
}

//form submit olursa
uiElement.searchForm.addEventListener("submit",(e)=>{
    e.preventDefault()

    const city = uiElement.searchInput.value
    handleSearch(city)
})

//arama baslat
const handleSearch = async (city) =>{

    const name = city.trim()

    if (!name) {
        renderError("sehir ismi zorunlu")
        return
    }
    //hata ekrani temizle
    clearError()

    setLoader(true)

    try {

        const data = await getWeatherData(city, STATE.units)

        if (data.cod === "404"){
            renderError("sehir bulunamadi")
            return
        }

        const flagUrl = getFlagUrl(data.sys.country)

        pushRecent(name)

        renderWeatherData(data, flagUrl, STATE.units)

    } catch (error) {
        renderError(error.message || "sehir bulunmadi")

    } finally {
        setLoader(false)
    }
}

//son aratilanlari kaydet
const pushRecent = (city) => {
    const updated = [city, ...STATE.recent.filter((c) => c.toLowerCase() !== city.toLowerCase())].slice(0,6)

    STATE.recent = updated

    renderRecentChips(STATE.recent, (city) => {
        uiElement.searchInput.value = city
        handleSearch(city)
    })

    persist()
}


//birim alanin tiklanmasi
uiElement.unitToggle.querySelectorAll("button").forEach((btn)=>{
    btn.addEventListener("click", async() => {

        const nextUnits = btn.value

        if (STATE.units === nextUnits) {
            return
        }
        STATE.units = nextUnits
        
        persist()

        updateUnitToggle(nextUnits)

        handleSearch(STATE.recent[0])
    })
})