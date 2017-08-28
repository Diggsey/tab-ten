import { EJSON } from 'meteor/ejson';
import { createReactiveArray } from '../../api/stream.js';
import '../../api/random.js'


// Names of the non-transitive facets
export const Facets = ["Rock", "Paper", "Scissors"];

// Maximum effect on a player's effective score due to non-transitive facets
const FacetEffect = 200;
const FacetAdjustment = 1;
const ScoreAdjustment = 100;

function calculateWinProbability(scoreRatio) {
    // First calculate the probabilty that this player gets to 11 points before the other player gets to 10 points
    // ie. it's a clean win by at least 2 clear points. This is modelled by summing the relevant probabilities from
    // a binomial distribution.
    // The coefficients of the resulting polynomial are listed here:
    const coeffs = [167960, -1385670, 5116320, -11085360, 15519504, -14549535, 9129120, -3695120, 875160, -92378];
    const xn = [1];
    for (let i = 0; i < 11; ++i)
        xn.push(xn[i]*scoreRatio);
    let result = 0.0;
    for (let i = 0; i < coeffs.length; ++i)
        result += coeffs[i]*xn[i];
    result *= xn[11];

    // Even if this player did not win cleanly, they could still win after reaching 10-10. Any even score after
    // 10-10, such as 11-11 has the same probability of a given player winning.
    // Starting from an even score, we look at every possibility for the next two points:
    // - win, win: this player wins (p = scoreRatio*scoreRatio)
    // - win, loss: back to even score (p = scoreRatio*(1-scoreRatio))
    // - loss, win: back to even score (p = (1-scoreRatio)*scoreRatio)
    // - loss, loss: this player loses (p = (1-scoreRatio)*(1-scoreRatio))
    //
    // Only the first three events give any chance of this player winning.
    // Let X be the probability of winning from an even score, then:
    //           (win, win)          (win, loss) or (loss, win)
    //   X = scoreRatio*scoreRatio + 2*(1-scoreRatio)*scoreRatio * X
    //
    // Solve for X:
    //   X = scoreRatio^2/(1-2*scoreRatio*(1-scoreRatio))
    //
    // Probability of getting to an even score in the first place, comes from the binomial distribution:
    //   (184756 * scoreRatio^10 * (1-scoreRatio)^10)

    result += 184756 * xn[10] * Math.pow((1-scoreRatio), 10) * xn[2] / (1-2*scoreRatio*(1-scoreRatio))
    return result;
}

function generateInitialFacets(n) {
    const result = new Array(n);
    const avg = 1.0/Facets.length;
    const rnd = Math.seedrandom(42);

    for (let i = 0; i < n; ++i) {
        const item = new Array(Facets.length);
        item[0] = 1.0;
        for (let j = 1; j < Facets.length; ++j) {
            item[j] = avg + (rnd()-0.5)*0.1*avg;
            item[0] -= item[j];
        }
        result[i] = item;
    }
    return result;
}

const InitialPlayerFacets = generateInitialFacets(20);

function compareFacets(a, b) {
    return (a == b) ? 0 : (((a & 1) ^ (b & 1) ^ (a < b)) ? 1 : -1);
}

function calculatePointRatio(a, b) {
    // Calculate the ratio of point scoring betweeen a and b
    // Ranges from 0.0 to 1.0

    // This factor will range from -1 to +1
    let facetContribution = 0.0;
    for (let i = 0; i < Facets.length; ++i)
        for (let j = 0; j < Facets.length; ++j)
            facetContribution += a.facets[i]*b.facets[j]*compareFacets(i, j);

    facetContribution *= FacetEffect;

    const effectiveScoreA = a.score + facetContribution;
    const effectiveScoreB = b.score - facetContribution;
    const deltaScore = effectiveScoreB - effectiveScoreA;

    return 1.0/(1.0 + Math.pow(10, deltaScore/400.0));
}

function clampFacets(facets) {
    let remainder;
    let attempts = 0;
    do {
        let aboveMin = 3;
        let belowMax = 3;
        remainder = 0.0;

        for (let i = 0; i < facets.length; ++i) {
            let f = facets[i];
            if (f <= 0.0) {
                --aboveMin;
                remainder += f;
                f = 0.0;
            } else if (f >= 1.0) {
                --belowMax;
                remainder += f - 1.0;
                f = 1.0;
            }
            facets[i] = f;
        }

        if (remainder < 0.0) {
            remainder /= aboveMin;
            for (let i = 0; i < facets.length; ++i)
                if (facets[i] > 0.0)
                    facets[i] += remainder;
        } else if (remainder > 0.0) {
            remainder /= belowMax;
            for (let i = 0; i < facets.length; ++i)
                if (facets[i] < 1.0)
                    facets[i] += remainder;
        }

        ++attempts;
    } while (remainder != 0.0 && attempts < 5);
}

function updateFacets(a, b, strength) {
    const adjustA = new Array(Facets.length);
    const adjustB = new Array(Facets.length);
    for (let i = 0; i < Facets.length; ++i) {
        adjustA[i] = 0.0;
        adjustB[i] = 0.0;
    }

    for (let i = 0; i < Facets.length; ++i)
        for (let j = 0; j < Facets.length; ++j) {
            const result = compareFacets(i, j);
            adjustA[i] += b.facets[j]*result;
            adjustB[j] -= a.facets[i]*result;
        }
    
    // First, naively apply adjustments
    let totalA = 0.0;
    let totalB = 0.0;
    for (let i = 0; i < Facets.length; ++i) {
        a.facets[i] += adjustA[i]*strength;
        b.facets[i] += adjustB[i]*strength;
        totalA += a.facets[i];
        totalB += b.facets[i];
    }

    // Rebalance facets
    const shiftA = (1.0 - totalA) / Facets.length;
    const shiftB = (1.0 - totalB) / Facets.length;
    for (let i = 0; i < Facets.length; ++i) {
        a.facets[i] += shiftA;
        b.facets[i] += shiftB;
    }

    // Clamp to required range
    clampFacets(a.facets);
    clampFacets(b.facets);
}

function initPlayer(state, player) {
    if (!state[player]) {
        let playerCount = Object.keys(state).length;
        state[player] = {
            score: 700,
            boost: 100,
            facets: EJSON.clone(InitialPlayerFacets[
                playerCount % InitialPlayerFacets.length
            ])
        }
    }
    return state[player];
}

function applyBoost(player) {
    const boost = player.boost * 0.1;
    player.score += boost;
    player.boost -= boost;
}

export const HyperScore = createReactiveArray({}, (prevState, record) => {
    const newState = EJSON.clone(prevState);
    const winner = initPlayer(newState, record.winner);
    const loser = initPlayer(newState, record.loser);

    const expectedRatio = calculatePointRatio(winner, loser);
    const actualRatio = record.winnerScore / (record.winnerScore + record.loserScore);

    const adjustmentScale = actualRatio - expectedRatio;

    const scoreAdjustment = adjustmentScale * ScoreAdjustment;
    winner.score += scoreAdjustment;
    loser.score -= scoreAdjustment;
    updateFacets(winner, loser, adjustmentScale*FacetAdjustment);

    // Apply learning boost
    applyBoost(winner);
    applyBoost(loser);

    return newState;
});
