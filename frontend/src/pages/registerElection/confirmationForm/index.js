import React, {Component} from 'react';
import moment from 'moment';
import Web3 from 'web3';
import {Messages} from 'primereact/messages';
import apiBlockchain from '../../../services/apiBlockchain';
import './styles.css';


export default class ConfirmationForm extends Component {
  constructor(props) {
    super(props);
      this.state = {
        electionName: this.props.electionName,
        domain: this.props.domain,
        calendarBegin: this.props.calendarBegin,
        calendarEnd: this.props.calendarEnd,
        candidates: this.props.candidates,
        metamaskAddr: ""
      };

      this.factoryJson = this.factoryJson.bind(this);
      this.factoryJsonCandidate = this.factoryJsonCandidate.bind(this);


  }

  factoryJson () {
    const date1 = `${this.state.calendarBegin.getFullYear()}.${this.state.calendarBegin.getMonth()+1}.${this.state.calendarBegin.getDate()} ${this.state.calendarBegin.getHours()}:${this.state.calendarBegin.getMinutes()}:${this.state.calendarBegin.getSeconds()}`
    const date2 = `${this.state.calendarEnd.getFullYear()}.${this.state.calendarEnd.getMonth()+1}.${this.state.calendarEnd.getDate()} ${this.state.calendarEnd.getHours()}:${this.state.calendarEnd.getMinutes()}:${this.state.calendarEnd.getSeconds()}`
    const mom1 = moment(date1, 'YYYY.MM.DD HH:mm:ss').unix()
    const mom2 = moment(date2, 'YYYY.MM.DD HH:mm:ss').unix()
    const obj = {
      ownerAddress: this.state.metamaskAddr,
      election :{
      name: this.state.electionName,
      domain: '@'+this.state.domain,
      opening: mom1,
      closing: mom2
      }
    }

    return obj;
  }

  factoryJsonCandidate (candidateName, numberToVote, electionId) {
    const obj = {
      ownerAddress: this.state.metamaskAddr,
      candidate: {
        electionID: electionId,
        name: candidateName,
        number: numberToVote,
      },
    };
    console.log(obj);
    return obj;
  }

  /*
  Ex JSON:

  {
    "ownerAddress": "0x12D31fce5cb8640EcC171518eab723DDD0588Ce4",
    "candidate": {
      "electionID": 1,
      "name": "Pedro Henrique",
      "number": 30
    }
  }

*/





  render() {

    this.confirmarCadastro =  async () => {
      const web3 = new Web3(Web3.givenProvider);
      let currentAccount;
      const onMetaMask = this.onMetamaskAddr;
      const state = this.state;
      const facJson = this.factoryJson;
      const cadastrarEleicao = this.cadastrarEleicao;



      if(Web3.givenProvider === null) {
        this.messages.show({
          severity: 'info',
          summary: 'Aviso',
          detail: 'É preciso estar conectado ao metamask para prosseguir'
        })
      }else {
        (async function getCurrentAccount(){
          await Web3.givenProvider.enable()

          web3.eth.getAccounts((err, accounts) => {
            currentAccount = accounts
            state.metamaskAddr = currentAccount[0];
            cadastrarEleicao(facJson());
          })


        })()
      }

    }


    this.cadastrarEleicao = async jsonEleicao => {
      const factoryCandidate = this.factoryJsonCandidate;
      await apiBlockchain.post('/createElection', jsonEleicao).then(
        response => {
          const {electionID} = response.data;
          const {candidates} = this.state;

          candidates.map(string => {

            // let name = '';
            // let number = null;

            // for(let i of string) {
            //   if(i !== '(' && i !== ')' && i !== ' ' && !this.isNumber(i)) {
            //     name += i;
            //   }else if(this.isNumber(i)) {
            //     number = i;
            //   }
            // }

            // number = parseInt(number, 10);

            const match = (/^(.+?)\((\d+)\)$/gi).exec(string);
            const name = match[1].trim();
            const number = parseInt(match[2], 10);
            console.log(name, number);
            this.cadastrarCandidatos(factoryCandidate(name, number, electionID));

          })

          this.growl.show({ severity: 'success', summary: 'Eleicao cadastrada com sucesso!' });


        }).catch(error => {
          if(!error.response) {
            this.messages.show({
              severity: 'info',
              summary: 'Erro',
              detail: 'Não foi possível acessar o servidor, tente novamente mais tarde.'
            })
        }else {
          this.messages.show({
            severity: 'info',
            summary: 'Erro',
            detail: 'Não foi possível cadastrar a eleição verifique se os dados estão corretos.'
          })
        }
      })

    }

    this.isNumber = (num) => { //deve ter alguma função primitiva pra isso, mas como eu to sem paciencia vai assim mesmo.
      let bool = false;
      for(let i = 0; i < 10; i++) {
        if(num == i) { // sim a comparação deve ser feita com '==';
          bool = true;
          break;
        }
      }

      return bool;
    }

    this.cadastrarCandidatos = async (json) => {
      const status = await apiBlockchain.post('/addCandidate', json);
    }

    const nomeEleicao = this.state.electionName;
    const dominio = this.state.domain === '' ? this.state.domain : '@'+this.state.domain;
    const calendarIni = this.state.calendarBegin;
    const calendarFim = this.state.calendarEnd;
    const candidatos = this.state.candidates;


    return(

      <span className="main-form" >


        <h1>Nome da Eleição</h1>
        <h2>{nomeEleicao}</h2>
        {/* {console.log(nomeEleicao)} */}
        <br/>

        <h1>Domínio</h1>
        <h2>{dominio}</h2>
        {/* {console.log(dominio)} */}
        <br/>

        <h1>Data e Hora de início</h1>
        <h2>{calendarIni.toString()}</h2>
        {/* {console.log(calendarIni)} */}
        <br/>

        <h1>Data e Hora de fim</h1>
        <h2>{calendarFim.toString()}</h2>
        {/* {console.log(calendarFim)} */}
        <br/>

        <h1>Candidatos</h1> {candidatos.map(
                      (cand, index) => <h2 key={index} >{cand.toString()}</h2>
                      )
                    }


        <button className="bt-input-confirm" onClick={this.confirmarCadastro}>Cadastrar</button>
        <Messages ref={(el) => this.messages = el} />

      </span>


    );



  }
}