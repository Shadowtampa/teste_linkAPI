const express = require('express')
const mongoose = require('mongoose')
const axios = require('axios')
const router = express.Router()

var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost/db_linkAPI'

//Criação do modelo e do Schema do Deal
const Deal = mongoose.model(
  'Deal',
  mongoose.Schema({
    id: {
      type: String,
      require: true,
      unique: true,
    },
    title: {
      type: String,
      require: true,
    },
    status: {
      type: String,
      require: true,
    },
    produto: {
      type: String,
      require: true,
    },
    quantidade_produto: {
      type: String,
      require: true,
    },
    cliente: {
      type: String,
      require: true,
    },
    created_at: {
      type: Date,
      default: Date.now(),
    },
  }),
)
//Função para recuperar os deals do pipedrive e inserir no banco de dados
function getDeals(data) {
  //axios faz a busca no pipedrive por deals com status ganho
  axios
    .get(
      'https://api.pipedrive.com/v1/deals/?api_token=6a1db21cdeed326cd20ada1ffac064ff383f6c8f&api_token=%3Fapi_token%3D6a1db21cdeed326cd20ada1ffac064ff383f6c8f',
      {
        params: {
          status: 'won',
        },
      },
    )
    .then(function (response) {

      //apenas os dados das deals são aproveitados
      deals = response.data.data

      MongoClient.connect(url, function (err, db) {
        if (err) throw err
        var dbo = db.db('db_linkAPI')

        //é realizado um map nos dados aproveitados e eles são inseridos conforme modelado no schema
        deals.map(function (deal) {


          var myobj = {
            id: deal.id,
            title: deal.title,
            status: deal.status,
            quantidade_produto: deal.products_count,
            cliente: deal.person_name,
          }
          //é realizada uma busca no banco de dados pelo id do deal que será inserido: se a busca retornar algum valor, não é adicionado o doc
          dbo
            .collection('deals')
            .find({ id: myobj.id })
            .toArray(function (err, result) {
              if (err) throw err
              if (result.length == 0) {
                dbo.collection('deals').insertOne(myobj, function (err, res) {
                  if (err) throw err
                  console.log('1 documento inserido')
                })
              }
            })
        })
      })
      
    })
    .catch(function (error) {
      console.log(error)
    })
    
}

//Função para recuperar os deals do banco de dados e inserir no bling
function sendDeals() {


  MongoClient.connect(url, function (err, db) {
    if (err) throw err
    var dbo = db.db('db_linkAPI')
    //os dados do banco são buscados e transformados em um array
    dbo
      .collection('deals')
      .find({})
      .toArray(function (err, result) {
        if (err) throw err
        result.map(function (deal) {


          // esta é a parte que eu menos me orgulho do codigo. Tive algum problema na hora de passar args para o axios, então resolvi que o melhor seria fazer a inserção dos dados de maneira direta na URL
          // provavelmente é um problema com XML.

          //é feito um map para verificar todos os deals do banco, e são inseridas as informações relativas à quantidade de pedidos e o cliente, que julguei ser a "person" cadastrada no pipedrive.
          axios.post('https://bling.com.br/Api/v2/pedido/json/?apikey=2bb9b4143a97fd628a461f7a8e49fdb88ab443de9e285ddd06170307e9ce52068ed4d110&xml=%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%0A%3Cpedido%3E%0A%20%3Ccliente%3E%0A%20%3Cnome%3E'+deal.cliente+'%3C%2Fnome%3E%0A%20%3C%2Fcliente%3E%0A%3Cvolume%3E%0A%20%3C%2Fvolume%3E%0A%20%3Citens%3E%0A%20%3Citem%3E%0A%20%3Ccodigo%3E002%3C%2Fcodigo%3E%0A%20%3Cdescricao%3ECaneca%203%3C%2Fdescricao%3E%0A%20%3Cqtde%3E'+deal.quantidade_produto+'%3C%2Fqtde%3E%0A%20%3Cvlr_unit%3E'+35+'%3C%2Fvlr_unit%3E%0A%20%3C%2Fitem%3E%0A%20%3C%2Fitens%3E%0A%20%3Cobs%3ETsssssssssstando%20o%20camssspoo%3C%2Fobs%3E%0A%20%3Cobs_internas%3ETestanssssdo%20o%20caedido%3C%2Fobs_internas%3E%0A%3C%2Fpedido%3E')

        })
      })
  })
}

//rota para fazer a recuperação dos deals 
router.get('/index', async (request, response) => {
  getDeals()

  return response.json({
    message: 'won deals stored',
  })
})

//rota para fazer o registro dos deals
router.get('/register', async (request, response) => {
  sendDeals()
  return response.json({
    message: 'won deals registered in bling',
  })
})

module.exports = (app) => app.use('/deals', router)
