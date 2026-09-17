import "server-only";
import { randomInt } from "node:crypto";

// Reviewed allowlist of neutral words. Review additions for insults and regional slang.
// Public vocabulary, never a list of credentials. Six letters keep the generated
// password compatible with the existing minimum of twelve characters.
export const INITIAL_PASSWORD_WORDS = `
abacate abacaxi abobora abrigo acacia acento acervo acorde acucar adagio
adorno afluente agulha alameda alface alicerce alimento almofada alpino ameixa
amendoa amizade amostra ancora anelado antena antigo aplausos aquarela aragem
arcoiris armazem arquivo arvore asfalto assunto atalho aurora aventura azaleia
azulado azulejo bailado balada balanca bambuzal bandeira barraca batata beleza
biblioteca biscoito bosque brilhante brocado buriti cabana caderno cafezal caixote
cajueiro caminho campina cancela caneta cantiga caramelo caravela carinho carteira
casaco cascata castanha caverna cebola cenario cereja certeza chaleira chegada
chocolate cidade ciranda claridade colheita coluna cometa confete convite coragem
corrida cortina costume cristal cuidado cultura curativo damasco desenho destino
detalhe diamante diario dourado encanto encontro energia ensino ervilha escola
escova escudo esmeralda espelho esporte estante estrela estudo fabrica fantasia
farinha fazenda ferradura festival figura flanela flecha floresta fortuna fronteira
fruteira galeria garagem garrafa gaveta geleia gentileza girassol gotinha gravata
horizonte imenso inverno jabuticaba jacaranda janela jangada jardim jasmim jornada
junino lavanda legenda leitura limoeiro limpeza livraria luminoso madeira maestria
mangueira manteiga martelo melancia melodia mensagem mercado mercurio mergulho mochila
moinho montanha morango mosaico musica natureza neblina novidade oceano oficina
oliveira orvalho pacote palacio paleta palmeira panela papoula parede parque
passarela passeio pastagem perfume perola pintura pipoca planeta ponteira porteira
pradaria presente primavera projeto quintal recanto receita regador relevo relogio
repolho riacho ribeira riqueza rochedo roseira rubrica sabedoria sacola safira
salada salgueiro samambaia sapato semente sereno serrote silvestre sorriso tapete
tecido teclado tempero tesouro tijolo tinteiro tomate torneira trabalho triciclo
tulipa universo urucum varanda veleiro veludo ventania verdura viagem violeta
vitrine vontade
`
  .trim()
  .split(/\s+/);

export function generateInitialPassword(): string {
  const word = INITIAL_PASSWORD_WORDS[randomInt(INITIAL_PASSWORD_WORDS.length)]!;
  return word[0]!.toUpperCase() + word.slice(1) + String(randomInt(1_000_000)).padStart(6, "0");
}
