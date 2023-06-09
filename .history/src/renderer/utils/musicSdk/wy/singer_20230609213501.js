import { eapiRequest } from './utils/index'

export default {
    getInfo(id){
        return eapiRequest("/api/artist/head/info/get", {
            id: 1143033,
        }).then(body => {
            
        })
    }
}