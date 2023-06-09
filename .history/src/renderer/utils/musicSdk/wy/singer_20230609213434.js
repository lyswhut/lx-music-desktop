import { eapiRequest } from './utils/index'

export default {
    getInfo(id){
        return eapiRequest("/api/artist/head/info/get", {
            
        })
    }
}