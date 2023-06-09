import { eapiRequest } from './utils/index'

export default {
    async getInfo(id){
        const request = await eapiRequest("/api/artist/head/info/get", { id: 1143033 }).then(({ body }) => {

        })
    }
}